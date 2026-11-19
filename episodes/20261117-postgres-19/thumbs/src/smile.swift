// Faces with eye opening, pupils, outer-lip points, yaw/roll. JSON lines. stdin: image paths.
import Foundation
import Vision
import AppKit
func pts(_ r: VNFaceLandmarkRegion2D?, _ s: CGSize) -> [[Int]] { (r?.pointsInImage(imageSize: s) ?? []).map { [Int($0.x), Int(s.height - $0.y)] } }
while let p = readLine() {
  guard let im = NSImage(contentsOfFile: p), let cg = im.cgImage(forProposedRect: nil, context: nil, hints: nil) else { continue }
  let s = CGSize(width: cg.width, height: cg.height)
  let rq = VNDetectFaceLandmarksRequest(); rq.revision = VNDetectFaceLandmarksRequestRevision3
  try? VNImageRequestHandler(cgImage: cg).perform([rq])
  var out: [[String: Any]] = []
  for f in rq.results ?? [] {
    let b = f.boundingBox, l = f.landmarks
    out.append(["box": [Int(b.minX*s.width), Int((1-b.maxY)*s.height), Int(b.width*s.width), Int(b.height*s.height)],
      "yaw": f.yaw?.doubleValue ?? 0, "roll": f.roll?.doubleValue ?? 0, "q": f.faceCaptureQuality ?? -1,
      "le": pts(l?.leftEye, s), "re": pts(l?.rightEye, s), "lips": pts(l?.outerLips, s), "inner": pts(l?.innerLips, s), "nose": pts(l?.nose, s)])
  }
  let d = try! JSONSerialization.data(withJSONObject: ["f": p, "faces": out]); print(String(data: d, encoding: .utf8)!)
}
