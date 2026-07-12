using IKPhones.Core.Enums;
using System.Threading.Tasks;
using System;

namespace IKPhones.Application.Interfaces;

public interface IStockNotifier
{
    Task NotifyStockUpdateAsync(Guid itemId, ItemStatus newStatus);
}