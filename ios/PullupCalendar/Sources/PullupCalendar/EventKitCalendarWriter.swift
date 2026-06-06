import EventKit
import Foundation

public struct PullupCalendarEvent: Equatable, Sendable {
    public let title: String
    public let notes: String
    public let location: String?
    public let startDate: Date
    public let endDate: Date
    public let attendeeEmails: [String]

    public init(
        title: String,
        notes: String,
        location: String? = nil,
        startDate: Date,
        endDate: Date,
        attendeeEmails: [String] = []
    ) {
        self.title = title
        self.notes = notes
        self.location = location
        self.startDate = startDate
        self.endDate = endDate
        self.attendeeEmails = attendeeEmails
    }
}

public enum EventKitCalendarWriterError: Error, Equatable {
    case accessDenied
    case invalidDateRange
    case missingWritableCalendar
    case missingEventIdentifier
}

@MainActor
public protocol EventKitEventStore {
    func requestWriteAccess() async throws -> Bool
    func defaultWritableCalendar() -> EKCalendar?
    func save(_ event: EKEvent) throws
}

extension EKEventStore: EventKitEventStore {
    public func requestWriteAccess() async throws -> Bool {
        try await requestWriteOnlyAccessToEvents()
    }

    public func defaultWritableCalendar() -> EKCalendar? {
        defaultCalendarForNewEvents
    }

    public func save(_ event: EKEvent) throws {
        try save(event, span: .thisEvent, commit: true)
    }
}

@MainActor
public final class EventKitCalendarWriter {
    private let eventStore: EventKitEventStore
    private let makeEvent: (EKEventStore) -> EKEvent
    private let backingStore: EKEventStore?

    public convenience init() {
        let store = EKEventStore()
        self.init(eventStore: store, backingStore: store)
    }

    init(
        eventStore: EventKitEventStore,
        backingStore: EKEventStore? = nil,
        makeEvent: ((EKEventStore) -> EKEvent)? = nil
    ) {
        self.eventStore = eventStore
        self.backingStore = backingStore
        self.makeEvent = makeEvent ?? { EKEvent(eventStore: $0) }
    }

    public func requestWriteOnlyCalendarAccess() async throws -> Bool {
        try await eventStore.requestWriteAccess()
    }

    @discardableResult
    public func createEvent(_ input: PullupCalendarEvent) async throws -> String {
        guard input.endDate > input.startDate else {
            throw EventKitCalendarWriterError.invalidDateRange
        }

        guard try await requestWriteOnlyCalendarAccess() else {
            throw EventKitCalendarWriterError.accessDenied
        }

        guard let calendar = eventStore.defaultWritableCalendar() else {
            throw EventKitCalendarWriterError.missingWritableCalendar
        }

        guard let store = backingStore ?? eventStore as? EKEventStore else {
            throw EventKitCalendarWriterError.missingWritableCalendar
        }

        let event = makeEvent(store)
        event.title = input.title
        event.notes = input.notes
        event.location = input.location
        event.startDate = input.startDate
        event.endDate = input.endDate
        event.calendar = calendar

        try eventStore.save(event)

        guard let eventIdentifier = event.eventIdentifier else {
            throw EventKitCalendarWriterError.missingEventIdentifier
        }

        return eventIdentifier
    }
}

public enum PullupCalendarInfoPlist {
    public static let writeOnlyUsageDescriptionKey = "NSCalendarsWriteOnlyAccessUsageDescription"
    public static let fullAccessUsageDescriptionKey = "NSCalendarsFullAccessUsageDescription"
}
