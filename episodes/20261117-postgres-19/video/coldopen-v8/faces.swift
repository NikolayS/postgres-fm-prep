// Face boxes and pupils with Apple Vision. Reads image paths (one per line) on stdin; prints one JSON
// line per image: {"f": path, "b": [[x, y, w, h, lx, ly, rx, ry], ...]} in pixels, top-left origin,
// largest face first (lx..ry: pupils, -1 when Vision finds none).
// Usage: ls dir/*.jpg | swift faces.swift > faces.jsonl
import Foundation
import Vision
import AppKit
while let line = readLine() {
  let path = line.trimmingCharacters(in: .whitespaces); if path.isEmpty { continue }
  guard let img = NSImage(contentsOfFile: path), let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { print("{\"f\":\"\(path)\",\"b\":[]}"); continue }
  let W = Double(cg.width), H = Double(cg.height)
  let req = VNDetectFaceLandmarksRequest()
  try? VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
  let boxes = (req.results ?? []).map { r -> [Int] in
    let b = r.boundingBox
    var e = [-1, -1, -1, -1]
    if let l = r.landmarks?.leftPupil?.pointsInImage(imageSize: CGSize(width: W, height: H)).first,
       let q = r.landmarks?.rightPupil?.pointsInImage(imageSize: CGSize(width: W, height: H)).first {
      e = [Int(l.x), Int(H - l.y), Int(q.x), Int(H - q.y)]
    }
    return [Int(b.minX * W), Int((1 - b.maxY) * H), Int(b.width * W), Int(b.height * H)] + e
  }.sorted { $0[2] * $0[3] > $1[2] * $1[3] }
  print("{\"f\":\"\(path)\",\"b\":\(boxes)}")
}
