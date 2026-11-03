import Foundation

// Written by the app (src/features/widget/snapshot.ts, sync.ts) through
// modules/widget-file. Finished texts only; the widget formats nothing.
let appGroup = "group.com.scully98.calorieweightbalancer"
let snapshotPath = "widget/snapshot.v1.json"

struct WidgetSnapshot: Decodable {
  static let supportedVersion = 1

  let version: Int
  let loadedAt: Date
  let staleAfter: Date?
  let title: String
  let dates: String
  let stale: String
  let staleLabel: String
  let content: Content

  enum Content: Decodable {
    case balance(Balance)
    case empty(Empty)

    private enum CodingKeys: String, CodingKey { case kind }

    init(from decoder: Decoder) throws {
      let kind = try decoder.container(keyedBy: CodingKeys.self).decode(String.self, forKey: .kind)
      switch kind {
      case "balance": self = .balance(try Balance(from: decoder))
      case "empty": self = .empty(try Empty(from: decoder))
      default:
        throw DecodingError.dataCorruptedError(
          forKey: .kind, in: try decoder.container(keyedBy: CodingKeys.self),
          debugDescription: "Unknown kind \(kind)")
      }
    }
  }

  struct Balance: Decodable {
    let kcal: String
    let unit: String
    let range: String?
    let fat: String
    let lockFat: String
    let inline: String
    let label: String
    let lockLabel: String
  }

  struct Empty: Decodable {
    let message: String
    let inline: String
    let label: String
  }

  func isStale(at date: Date) -> Bool {
    staleAfter.map { date >= $0 } ?? false
  }

  static func load() -> WidgetSnapshot? {
    guard
      let url = FileManager.default
        .containerURL(forSecurityApplicationGroupIdentifier: appGroup)?
        .appendingPathComponent(snapshotPath),
      let data = try? Data(contentsOf: url)
    else { return nil }
    return decode(data)
  }

  static func decode(_ data: Data) -> WidgetSnapshot? {
    struct Version: Decodable { let version: Int }
    guard (try? JSONDecoder().decode(Version.self, from: data))?.version == supportedVersion
    else { return nil }
    let decoder = JSONDecoder()
    decoder.dateDecodingStrategy = .custom { decoder in
      let container = try decoder.singleValueContainer()
      let text = try container.decode(String.self)
      let formatter = ISO8601DateFormatter()
      formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
      guard let date = formatter.date(from: text) else {
        throw DecodingError.dataCorruptedError(
          in: container, debugDescription: "Not an ISO 8601 date: \(text)")
      }
      return date
    }
    return try? decoder.decode(WidgetSnapshot.self, from: data)
  }
}
