using PoolTracker.API.Models;

namespace PoolTracker.API.Services;

public class PoolService
{
    private readonly object _lock = new();

    private readonly Dictionary<DayOfWeek, string> _openingHours;

    private PoolStatus _status;

    public PoolService()
    {
        _openingHours = new Dictionary<DayOfWeek, string>
        {
            { DayOfWeek.Monday, "10:00–19:00" },
            { DayOfWeek.Tuesday, "10:00–19:00" },
            { DayOfWeek.Wednesday, "10:00–19:00" },
            { DayOfWeek.Thursday, "10:00–19:00" },
            { DayOfWeek.Friday, "10:00–19:00" },
            { DayOfWeek.Saturday, "09:00–19:00" },
            { DayOfWeek.Sunday, "09:00–19:00" }
        };

        _status = new PoolStatus
        {
            CurrentCount = 0,
            MaxCapacity = 120,
            IsOpen = true,
            LastUpdated = DateTime.UtcNow,
            TodayOpeningHours = GetTodayOpeningHours()
        };
    }

    private string GetTodayOpeningHours()
    {
        var today = DateTime.Today.DayOfWeek;
        return _openingHours.TryGetValue(today, out var hours) ? hours : "Encerrado";
    }

    public PoolStatus GetStatus()
    {
        lock (_lock)
        {
            _status.TodayOpeningHours = GetTodayOpeningHours();
            return _status;
        }
    }

    public PoolStatus Enter()
    {
        lock (_lock)
        {
            // impedir entrada quando piscina está fechada
            if (!_status.IsOpen)
            {
                _status.LastUpdated = DateTime.UtcNow;
                return _status;
            }

            if (_status.CurrentCount < _status.MaxCapacity)
                _status.CurrentCount++;

            _status.LastUpdated = DateTime.UtcNow;
            return _status;
        }
    }

    public PoolStatus Exit()
    {
        lock (_lock)
        {
            if (_status.CurrentCount > 0)
                _status.CurrentCount--;

            _status.LastUpdated = DateTime.UtcNow;
            return _status;
        }
    }

    public PoolStatus SetCount(int value)
    {
        lock (_lock)
        {
            value = Math.Clamp(value, 0, _status.MaxCapacity);
            _status.CurrentCount = value;
            _status.LastUpdated = DateTime.UtcNow;
            return _status;
        }
    }

    public PoolStatus SetOpenStatus(bool isOpen)
    {
        lock (_lock)
        {
            _status.IsOpen = isOpen;

            // 🔥 Regra nova: ao fechar → lotação = 0
            if (!isOpen)
            {
                _status.CurrentCount = 0;
            }

            _status.LastUpdated = DateTime.UtcNow;
            return _status;
        }
    }

    public PoolStatus SetCapacity(int value)
    {
        lock (_lock)
        {
            value = Math.Max(1, value);
            _status.MaxCapacity = value;

            if (_status.CurrentCount > value)
                _status.CurrentCount = value;

            _status.LastUpdated = DateTime.UtcNow;
            return _status;
        }
    }
}
