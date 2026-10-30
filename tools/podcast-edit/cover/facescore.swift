// Scores face frames with macOS Vision. Output CSV per file:
// file,faceW,yaw,roll,eyeOpen,mouthOpen,glare,sharp,smile
import Foundation
import Vision
import CoreImage
import AppKit

func gray(_ img: CGImage) -> ([Float], Int, Int) {
    let w = img.width, h = img.height
    var buf = [UInt8](repeating: 0, count: w * h)
    let cs = CGColorSpaceCreateDeviceGray()
    let ctx = CGContext(data: &buf, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w, space: cs, bitmapInfo: CGImageAlphaInfo.none.rawValue)!
    ctx.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))
    return (buf.map { Float($0) }, w, h)
}

func lapVar(_ g: [Float], _ w: Int, _ h: Int, _ r: CGRect) -> Float {
    let x0 = max(1, Int(r.minX)), x1 = min(w - 2, Int(r.maxX))
    let y0 = max(1, Int(r.minY)), y1 = min(h - 2, Int(r.maxY))
    if x1 <= x0 || y1 <= y0 { return 0 }
    var vals: [Float] = []
    for y in y0...y1 { for x in x0...x1 {
        let v = 4 * g[y*w+x] - g[y*w+x-1] - g[y*w+x+1] - g[(y-1)*w+x] - g[(y+1)*w+x]
        vals.append(v)
    } }
    let m = vals.reduce(0, +) / Float(vals.count)
    return vals.reduce(0) { $0 + ($1 - m) * ($1 - m) } / Float(vals.count)
}

func brightFrac(_ g: [Float], _ w: Int, _ h: Int, _ r: CGRect, _ th: Float) -> Float {
    let x0 = max(0, Int(r.minX)), x1 = min(w - 1, Int(r.maxX))
    let y0 = max(0, Int(r.minY)), y1 = min(h - 1, Int(r.maxY))
    if x1 <= x0 || y1 <= y0 { return 1 }
    var n = 0, b = 0
    for y in y0...y1 { for x in x0...x1 { n += 1; if g[y*w+x] > th { b += 1 } } }
    return Float(b) / Float(n)
}

func rgba(_ img: CGImage) -> [UInt8] {
    let w = img.width, h = img.height
    var buf = [UInt8](repeating: 0, count: w * h * 4)
    let cs = CGColorSpaceCreateDeviceRGB()
    let ctx = CGContext(data: &buf, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4, space: cs, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    ctx.draw(img, in: CGRect(x: 0, y: 0, width: w, height: h))
    return buf
}

// reflection: bright and nearly grey/blue-white pixels (screen glare), skin is warmer and darker
func glareFrac(_ p: [UInt8], _ w: Int, _ h: Int, _ r: CGRect) -> Float {
    let x0 = max(0, Int(r.minX)), x1 = min(w - 1, Int(r.maxX))
    let y0 = max(0, Int(r.minY)), y1 = min(h - 1, Int(r.maxY))
    if x1 <= x0 || y1 <= y0 { return 1 }
    var n = 0, b = 0
    for y in y0...y1 { for x in x0...x1 {
        n += 1
        let i = (y * w + x) * 4
        let rr = Int(p[i]), gg = Int(p[i+1]), bb = Int(p[i+2])
        let mx = max(rr, max(gg, bb)), mn = min(rr, min(gg, bb))
        if mn > 165 && (mx - mn) < 45 && bb >= rr - 10 { b += 1 }
    } }
    return Float(b) / Float(n)
}

func dist(_ a: CGPoint, _ b: CGPoint) -> CGFloat { hypot(a.x - b.x, a.y - b.y) }

let files = CommandLine.arguments.dropFirst()
print("file,faceW,yaw,roll,eyeOpen,mouthOpen,glare,sharp,smile,pitch,hand,faceX,faceY,faceH,browRaise,browAsym,handChin")
for f in files {
    guard let ns = NSImage(contentsOfFile: f), let cg = ns.cgImage(forProposedRect: nil, context: nil, hints: nil) else { continue }
    let (g, w, h) = gray(cg)
    let px = rgba(cg)
    let req = VNDetectFaceLandmarksRequest()
    let hreq = VNDetectHumanHandPoseRequest(); hreq.maximumHandCount = 2
    let handler = VNImageRequestHandler(cgImage: cg, options: [:])
    try? handler.perform([req, hreq])
    guard let face = (req.results ?? []).max(by: { $0.boundingBox.width < $1.boundingBox.width }) else {
        print("\(f),0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0"); continue
    }
    let bb = face.boundingBox
    // Vision bbox origin is bottom-left; convert to top-left pixel rect
    let fr = CGRect(x: bb.minX * CGFloat(w), y: (1 - bb.maxY) * CGFloat(h), width: bb.width * CGFloat(w), height: bb.height * CGFloat(h))
    func pts(_ r: VNFaceLandmarkRegion2D?) -> [CGPoint] {
        guard let r = r else { return [] }
        return r.normalizedPoints.map { CGPoint(x: fr.minX + $0.x * fr.width, y: fr.maxY - $0.y * fr.height) }
    }
    func box(_ p: [CGPoint], pad: CGFloat) -> CGRect {
        let xs = p.map { $0.x }, ys = p.map { $0.y }
        return CGRect(x: xs.min()! - pad, y: ys.min()! - pad, width: xs.max()! - xs.min()! + 2*pad, height: ys.max()! - ys.min()! + 2*pad)
    }
    func openness(_ p: [CGPoint]) -> CGFloat {
        guard p.count >= 6 else { return 0 }
        let b = box(p, pad: 0)
        return b.width > 0 ? b.height / b.width : 0
    }
    let le = pts(face.landmarks?.leftEye), re = pts(face.landmarks?.rightEye)
    let eyeOpen = (openness(le) + openness(re)) / 2
    let lips = pts(face.landmarks?.innerLips)
    let outer = pts(face.landmarks?.outerLips)
    let mouthOpen = openness(lips)
    // smile proxy: outer lips width relative to face width
    let smile = outer.isEmpty ? 0 : box(outer, pad: 0).width / fr.width
    let pad = fr.width * 0.10
    // lens glare: bright, low-saturation area over the whole lens (screen reflections are
    // bluish-white around 190-230, not 255), so threshold 185 over the eye box padded to lens size
    let glare = le.isEmpty || re.isEmpty ? 1 : max(glareFrac(px, w, h, box(le, pad: pad)), glareFrac(px, w, h, box(re, pad: pad)))
    let sharp = lapVar(g, w, h, fr)
    let yaw = face.yaw?.doubleValue ?? 0, roll = face.roll?.doubleValue ?? 0
    let pitch = face.pitch?.doubleValue ?? 0
    // hand occlusion: fraction of detected hand joints inside the face box (slightly enlarged)
    let faceBig = fr.insetBy(dx: -fr.width * 0.15, dy: -fr.height * 0.15)
    var hj = 0, hin = 0
    for hand in hreq.results ?? [] {
        if let all = try? hand.recognizedPoints(.all) { for (_, p) in all where p.confidence > 0.3 {
            hj += 1
            let px = CGPoint(x: p.location.x * CGFloat(w), y: (1 - p.location.y) * CGFloat(h))
            if faceBig.contains(px) { hin += 1 }
        } }
    }
    let hand = hj == 0 ? 0 : Double(hin) / Double(hj)
    // hand near chin: joints in the lower third of the face box, widened
    let chinBox = CGRect(x: fr.minX - fr.width * 0.3, y: fr.minY + fr.height * 0.6, width: fr.width * 1.6, height: fr.height * 0.6)
    var hchin = 0
    for hand in hreq.results ?? [] {
        if let all = try? hand.recognizedPoints(.all) { for (_, p) in all where p.confidence > 0.3 {
            let px = CGPoint(x: p.location.x * CGFloat(w), y: (1 - p.location.y) * CGFloat(h))
            if chinBox.contains(px) { hchin += 1 }
        } }
    }
    let handChin = hj == 0 ? 0 : Double(hchin) / Double(hj)
    // brow raise: vertical gap between eyebrow centre and eye centre, per side, over face height
    func cy(_ p: [CGPoint]) -> CGFloat { p.isEmpty ? 0 : p.map { $0.y }.reduce(0, +) / CGFloat(p.count) }
    let lb = pts(face.landmarks?.leftEyebrow), rb = pts(face.landmarks?.rightEyebrow)
    let lGap = (lb.isEmpty || le.isEmpty) ? 0 : (cy(le) - cy(lb)) / fr.height
    let rGap = (rb.isEmpty || re.isEmpty) ? 0 : (cy(re) - cy(rb)) / fr.height
    let browRaise = (lGap + rGap) / 2
    let browAsym = abs(lGap - rGap)
    print(String(format: "%@,%.0f,%.3f,%.3f,%.3f,%.3f,%.4f,%.1f,%.3f,%.3f,%.2f,%.0f,%.0f,%.0f,%.4f,%.4f,%.2f", f, fr.width, yaw, roll, eyeOpen, mouthOpen, glare, sharp, smile, pitch, hand, fr.midX, fr.midY, fr.height, browRaise, browAsym, handChin))
}
