namespace IKPhones.Core.Enums;

public enum OrderStatus
{
    // ─── CUSTOMER FRONTEND STATES ──────────────────────────────────────────
    Pending,          // Cart submitted, inventory locked, waiting for payment
    Paid,             // Payment successful, items officially sold, waiting for staff processing
    Cancelled,        // Payment failed, abandoned, or order voided; inventory released

    // ─── STAFF & LOGISTICS STATES ─────────────────────────────────────────
    Processing,       // Staff is actively gathering and packaging the physical units
    ReadyForDispatch, // Order is securely boxed, delivery verification PIN is generated
    OutForDelivery,   // Rider has accepted the batch and is currently in transit
    Delivered         // Secure handshake complete; customer provided matching PIN on delivery
}