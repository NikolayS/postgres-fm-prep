import Foundation
import Vision
import AppKit
// usage: swift faces.swift <dir>  -> prints JSON lines: {"f":"f00001.jpg","faces":[[x,y,w,h],...]} (top-left origin, normalized)
let dir = CommandLine.arguments[1]
let files = try FileManager.default.contentsOfDirectory(atPath: dir).filter { $0.hasSuffix(".jpg") }.sorted()
for f in files {
  let url = URL(fileURLWithPath: dir + "/" + f)
  let req = VNDetectFaceRectanglesRequest()
  let h = VNImageRequestHandler(url: url, options: [:])
  try? h.perform([req])
  let faces = (req.results ?? []).map { r -> [Double] in
    let b = r.boundingBox
    return [Double(b.minX), Double(1 - b.maxY), Double(b.width), Double(b.height), Double(r.confidence)]
  }
  let data = try JSONSerialization.data(withJSONObject: ["f": f, "faces": faces])
  print(String(data: data, encoding: .utf8)!)
}
