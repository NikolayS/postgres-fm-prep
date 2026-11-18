// Detect faces, pupils and eye opening with Apple Vision, largest face first.
// Usage: swiftc -O faces.swift -o /tmp/faces; printf '%s\n' image.jpg | /tmp/faces
// Outputs JSON lines with top-left pixel boxes, pupils (-1 if missing), and eye height/width ratios.
import Foundation
import Vision
import AppKit

struct Face: Encodable {
    let box: [Int]
    let pupils: [Int]
    let eyes: [Double]
}
struct Result: Encodable {
    let f: String
    let faces: [Face]
}
func pupil(_ region: VNFaceLandmarkRegion2D?, size: CGSize) -> [Int] {
    guard let point = region?.pointsInImage(imageSize: size).first else { return [-1, -1] }
    return [Int(point.x), Int(size.height - point.y)]
}
func opening(_ region: VNFaceLandmarkRegion2D?, size: CGSize) -> Double {
    guard let points = region?.pointsInImage(imageSize: size), !points.isEmpty else { return -1 }
    let xs = points.map { Double($0.x) }, ys = points.map { Double($0.y) }
    let width = xs.max()! - xs.min()!
    guard width > 0 else { return -1 }
    return ((ys.max()! - ys.min()!) / width * 1000).rounded() / 1000
}
let encoder = JSONEncoder()
while let path = readLine() {
    if path.isEmpty { continue }
    do {
        let faces: [Face] = try autoreleasepool {
            guard let image = NSImage(contentsOfFile: path),
                  let cg = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
                throw NSError(domain: "Faces", code: 1, userInfo: [NSLocalizedDescriptionKey: "Cannot read image: \(path)"])
            }
            let w = Double(cg.width), h = Double(cg.height)
            let size = CGSize(width: w, height: h)
            let request = VNDetectFaceLandmarksRequest()
            try VNImageRequestHandler(cgImage: cg, options: [:]).perform([request])
            return (request.results ?? []).sorted {
                $0.boundingBox.width * $0.boundingBox.height > $1.boundingBox.width * $1.boundingBox.height
            }.map { face in
                let b = face.boundingBox, landmarks = face.landmarks
                return Face(
                    box: [Int(b.minX * w), Int((1 - b.maxY) * h), Int(b.width * w), Int(b.height * h)],
                    pupils: pupil(landmarks?.leftPupil, size: size) + pupil(landmarks?.rightPupil, size: size),
                    eyes: [opening(landmarks?.leftEye, size: size), opening(landmarks?.rightEye, size: size)]
                )
            }
        }
        let data = try encoder.encode(Result(f: path, faces: faces))
        print(String(decoding: data, as: UTF8.self))
    } catch {
        FileHandle.standardError.write(Data("Face detection failed: \(error.localizedDescription)\n".utf8))
        exit(1)
    }
}
