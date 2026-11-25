// swift sheet.swift <dir with NN.png + labels.json> <out.png> <cols>
import AppKit
let a = CommandLine.arguments
let dir = a[1], out = a[2], cols = Int(a[3])!
let labels = try! JSONSerialization.jsonObject(with: Data(contentsOf: URL(fileURLWithPath: dir + "/labels.json"))) as! [[Any]]
let tw = 640, th = 360, lh = 30
let rows = (labels.count + cols - 1) / cols
let W = cols * tw, H = rows * (th + lh)
let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: W, pixelsHigh: H, bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
NSColor.white.setFill(); NSRect(x: 0, y: 0, width: W, height: H).fill()
for (i, l) in labels.enumerated() {
  let c = i % cols, r = i / cols
  let x = c * tw, yTop = r * (th + lh)
  let t = (l[0] as! NSNumber).doubleValue, id = l[1] as! String
  let mm = Int(t) / 60, ss = t - Double(mm * 60)
  let s = String(format: "%02d  %@  %d:%05.2f", i, id, mm, ss) as NSString
  s.draw(at: NSPoint(x: x + 6, y: H - yTop - lh + 6), withAttributes: [.font: NSFont.boldSystemFont(ofSize: 18), .foregroundColor: NSColor.black])
  if let img = NSImage(contentsOfFile: String(format: "%@/%02d.png", dir, i)) {
    img.draw(in: NSRect(x: x, y: H - yTop - lh - th, width: tw, height: th))
  }
}
NSGraphicsContext.current = nil
try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: out))
