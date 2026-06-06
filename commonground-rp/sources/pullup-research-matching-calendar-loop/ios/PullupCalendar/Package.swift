// swift-tools-version: 6.0

import PackageDescription

let package = Package(
    name: "PullupCalendar",
    platforms: [
        .iOS(.v17),
        .macOS(.v14),
    ],
    products: [
        .library(name: "PullupCalendar", targets: ["PullupCalendar"]),
    ],
    targets: [
        .target(name: "PullupCalendar"),
    ]
)
