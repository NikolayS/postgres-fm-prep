import Foundation
import Vision
import CoreImage
for p in CommandLine.arguments.dropFirst() {
  let ci = CIImage(contentsOf: URL(fileURLWithPath: p))!
  let r = VNDetectFaceRectanglesRequest()
  try! VNImageRequestHandler(ciImage: ci).perform([r])
  for f in r.results ?? [] { let b = f.boundingBox; let W = ci.extent.width, H = ci.extent.height
    print(p, Int(b.midX*W), Int((1-b.midY)*H), Int(b.height*H)) }
}
