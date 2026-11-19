// Prints, per image, the hand keypoints (top-left pixels, confidence > 0.3). JSON lines.
import Foundation
import Vision
import AppKit
while let p = readLine() {
  guard let im = NSImage(contentsOfFile: p), let cg = im.cgImage(forProposedRect: nil, context: nil, hints: nil) else { continue }
  let W = Double(cg.width), H = Double(cg.height)
  let rq = VNDetectHumanHandPoseRequest(); rq.maximumHandCount = 2
  try? VNImageRequestHandler(cgImage: cg).perform([rq])
  var hands: [[[Int]]] = []
  for o in rq.results ?? [] {
    let pts = (try? o.recognizedPoints(.all)) ?? [:]
    hands.append(pts.values.filter { $0.confidence > 0.3 }.map { [Int($0.location.x * W), Int((1 - $0.location.y) * H)] })
  }
  let d = try! JSONSerialization.data(withJSONObject: ["f": p, "hands": hands]); print(String(data: d, encoding: .utf8)!)
}
