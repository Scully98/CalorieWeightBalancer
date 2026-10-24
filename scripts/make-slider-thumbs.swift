// Draws the tolerance slider thumbs (design: 24 pt circle, fill = background,
// 2 pt ring = foreground, no shadow) for light and dark at 1x/2x/3x.
//
//   swift scripts/make-slider-thumbs.swift <light fg> <light bg> <dark fg> <dark bg>
//   swift scripts/make-slider-thumbs.swift 0B0B0B FFFFFF F4F4F4 000000
//
// The hex values are the tokens in src/theme/colors.ts; run again when they change.
import AppKit

let size: CGFloat = 24
let ring: CGFloat = 2
let output = URL(fileURLWithPath: "assets/images")

func color(_ hex: String) -> CGColor {
  let value = UInt32(hex, radix: 16)!
  return CGColor(
    srgbRed: CGFloat((value >> 16) & 0xFF) / 255,
    green: CGFloat((value >> 8) & 0xFF) / 255,
    blue: CGFloat(value & 0xFF) / 255,
    alpha: 1)
}

func draw(name: String, foreground: CGColor, background: CGColor) {
  for scale in [1, 2, 3] {
    let pixels = Int(size) * scale
    let context = CGContext(
      data: nil, width: pixels, height: pixels, bitsPerComponent: 8, bytesPerRow: 0,
      space: CGColorSpace(name: CGColorSpace.sRGB)!,
      bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    context.scaleBy(x: CGFloat(scale), y: CGFloat(scale))
    let inset = ring / 2
    let circle = CGRect(x: inset, y: inset, width: size - ring, height: size - ring)
    context.setFillColor(background)
    context.fillEllipse(in: circle)
    context.setStrokeColor(foreground)
    context.setLineWidth(ring)
    context.strokeEllipse(in: circle)
    let suffix = scale == 1 ? "" : "@\(scale)x"
    let url = output.appendingPathComponent("slider-thumb-\(name)\(suffix).png")
    let rep = NSBitmapImageRep(cgImage: context.makeImage()!)
    try! rep.representation(using: .png, properties: [:])!.write(to: url)
    print(url.path)
  }
}

let args = CommandLine.arguments
guard args.count == 5 else {
  print("usage: make-slider-thumbs.swift <light fg> <light bg> <dark fg> <dark bg>")
  exit(1)
}
try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
draw(name: "light", foreground: color(args[1]), background: color(args[2]))
draw(name: "dark", foreground: color(args[3]), background: color(args[4]))
