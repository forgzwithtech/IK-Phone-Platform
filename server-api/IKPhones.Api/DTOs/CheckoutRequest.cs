using System;
using System.Collections.Generic;

namespace IKPhones.Api.DTOs;

public class CheckoutRequest
{
    public required string CustomerName { get; set; }
    public required string CustomerEmail { get; set; }
    public required string CustomerPhone { get; set; }
    public string? DeliveryAddress { get; set; }
    
    // Changing from List<Guid> to match the React Cart Payload
    public required List<CartItemDto> Items { get; set; }
}

public class CartItemDto
{
    public required string Brand { get; set; }
    public required string ModelName { get; set; }
    public required string Storage { get; set; }
    public required string Color { get; set; }
    public required string Condition { get; set; }
    public int Quantity { get; set; }
}