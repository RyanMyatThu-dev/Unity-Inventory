using Unity_Inventory.Database.IMSDbContextModels;

namespace Unity_Inventory.Seeder;

internal static class RolePermissionSeedData
{
    private static readonly string[] Menus =
    [
        "dashboard",
        "inventory",
        "customers",
        "sales",
        "customerprices",
        "users",
        "business"
    ];

    private static readonly string[] Actions = ["view", "create", "edit", "delete"];

    /// <summary>
    /// Role-only rows (UserId always null). GrantedByUserId is the seed owner account.
    /// </summary>
    public static List<TblRolePermission> BuildForBusiness(int businessId, int grantedByUserId)
    {
        var list = new List<TblRolePermission>();
        var now = DateTime.UtcNow;

        void Add(string role, string menu, string action)
        {
            list.Add(new TblRolePermission
            {
                BusinessId = businessId,
                UserId = null,
                RoleName = role,
                MenuCode = menu,
                ActionCode = action,
                IsAllowed = true,
                IsRevoked = false,
                GrantedByUserId = grantedByUserId,
                RevokedByUserId = null,
                RevokedAt = null,
                CreatedAt = now,
            });
        }

        foreach (var menu in Menus)
        foreach (var action in Actions)
            Add("Owner", menu, action);

        foreach (var menu in Menus)
        foreach (var action in Actions)
        {
            if (menu == "users" && action == "delete")
                continue;
            if (menu == "business" && action == "delete")
                continue;
            Add("Admin", menu, action);
        }

        foreach (var (menu, action) in StaffPermissions)
            Add("Staff", menu, action);

        return list;
    }

    private static readonly (string Menu, string Action)[] StaffPermissions =
    [
        ("dashboard", "view"),
        ("inventory", "view"),
        ("customers", "view"),
        ("sales", "view"),
        ("sales", "create"),
        ("customerprices", "view"),
    ];
}
