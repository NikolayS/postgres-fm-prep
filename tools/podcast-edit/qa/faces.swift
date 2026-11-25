// Detect faces, pupils and eye opening with Apple Vision, largest face first.
// Usage: swiftc -O faces.swift -o /tmp/faces; printf '%s\n' image.jpg | /tmp/faces
// Outputs JSON lines with top-left pixel boxes, pupils (-1 if missing), eye height/width ratios,
// yaw (Vision, degrees, coarse: 0 or +-45) and nose: the nose-line offset from the face-box center,
// a fraction of the box width (+ = nose right of center = head turned to image-right; qa/facing.ts).
import Foundation
import Vision
import AppKit

struct Face: Encodable {
    let box: [Int]
    let pupils: [Int]
    let eyes: [Double]
    let yaw: Double?
    let nose: Double?
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
func noseOffset(_ region: VNFaceLandmarkRegion2D?, box: CGRect, size: CGSize) -> Double? {
    guard let points = region?.pointsInImage(imageSize: size), !points.isEmpty, box.width > 0 else { return nil }
    let x = points.map { Double($0.x) }.reduce(0, +) / Double(points.count)
    let cx = Double(box.midX) * Double(size.width)
    return ((x - cx) / (Double(box.width) * Double(size.width)) * 1000).rounded() / 1000
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
                    eyes: [opening(landmarks?.leftEye, size: size), opening(landmarks?.rightEye, size: size)],
                    yaw: face.yaw.map { ($0.doubleValue * 180 / Double.pi * 10).rounded() / 10 },
                    nose: noseOffset(landmarks?.noseCrest ?? landmarks?.nose, box: b, size: size)
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
