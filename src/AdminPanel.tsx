import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";

export function AdminPanel() {
  const [userEmail, setUserEmail] = useState("");
  const [showStaffList, setShowStaffList] = useState(false);
  const [itemName, setItemName] = useState("");
  const [imageName, setImageName] = useState("");
  
  const staffUsers = useQuery(api.staff.getAllStaffUsers);
  const assignStaffRole = useMutation(api.staff.assignStaffRole);
  const removeStaffRole = useMutation(api.staff.removeStaffRole);
  const makeFirstUserAdmin = useMutation(api.staff.makeFirstUserAdmin);
  const loadRealMenu = useMutation(api.menu.loadRealMenu);
  const updateMenuItemImage = useMutation(api.menu.updateMenuItemImage);
  
  const handleAssignStaff = async () => {
    if (!userEmail.trim()) {
      toast.error("Please enter a user email");
      return;
    }
    
    try {
      await assignStaffRole({ userEmail: userEmail.trim() });
      toast.success("Staff role assigned successfully");
      setUserEmail("");
    } catch (error: any) {
      toast.error(error.message || "Failed to assign staff role");
    }
  };
  
  const handleRemoveStaff = async (userId: string) => {
    try {
      await removeStaffRole({ userId: userId as any });
      toast.success("Staff role removed successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to remove staff role");
    }
  };
  
  const handleMakeAdmin = async () => {
    try {
      await makeFirstUserAdmin({});
      toast.success("Admin role assigned successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to assign admin role");
    }
  };

  const handleLoadRealMenu = async () => {
    try {
      await loadRealMenu({});
      toast.success("316 Food Truck menu loaded successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to load real menu");
    }
  };

  const handleUpdateImage = async () => {
    if (!itemName.trim() || !imageName.trim()) {
      toast.error("Please enter both item name and image filename");
      return;
    }
    
    try {
      const result = await updateMenuItemImage({ 
        itemName: itemName.trim(),
        imageName: imageName.trim()
      });
      toast.success(result);
      setItemName("");
      setImageName("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update image");
    }
  };
  
  if (!staffUsers) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Admin Panel</h2>
      
      
      {/* Load Real Menu */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-green-800 mb-2">Load Real Menu</h3>
        <p className="text-green-700 mb-3">
          Replace all current menu items with 316 Food Truck's actual products.
        </p>
        <button
          onClick={handleLoadRealMenu}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Load 316 Food Truck Menu
        </button>
      </div>

      {/* Update Menu Item Image */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Update Menu Item Image</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="Menu item name (e.g., Chai Latte)"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <input
            type="text"
            value={imageName}
            onChange={(e) => setImageName(e.target.value)}
            placeholder="Image filename (e.g., chailatte.png)"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <button
            onClick={handleUpdateImage}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Update Image
          </button>
        </div>
        <p className="text-sm text-blue-700">
          First upload your image to the /public folder, then enter the exact item name and filename here.
        </p>
      </div>

      {/* Assign Staff Role */}
      <div className="bg-white rounded-lg shadow border p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4">Assign Staff Role</h3>
        <div className="flex gap-3">
          <input
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            placeholder="Enter user email"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <button
            onClick={handleAssignStaff}
            className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
          >
            Assign Staff Role
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Enter the email address of a registered user to give them staff privileges.
        </p>
      </div>
      
      {/* Staff List */}
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Current Staff Members</h3>
          <button
            onClick={() => setShowStaffList(!showStaffList)}
            className="text-primary hover:underline"
          >
            {showStaffList ? "Hide" : "Show"} Staff List
          </button>
        </div>
        
        {showStaffList && (
          <>
            {staffUsers.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No staff members assigned yet.</p>
            ) : (
              <div className="space-y-3">
                {staffUsers.map((staffMember) => (
                  <div key={staffMember._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">
                        {staffMember.user?.name || staffMember.user?.email || "Unknown User"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Role: <span className="font-medium capitalize">{staffMember.role}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Assigned: {new Date(staffMember.assignedAt).toLocaleDateString()}
                        {staffMember.assignedByUser && (
                          <span> by {staffMember.assignedByUser.name || staffMember.assignedByUser.email}</span>
                        )}
                      </p>
                    </div>
                    {staffMember.role === "staff" && (
                      <button
                        onClick={() => handleRemoveStaff(staffMember.userId)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                      >
                        Remove Staff
                      </button>
                    )}
                    {staffMember.role === "admin" && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded font-medium">
                        Admin
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">How Staff Roles Work</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Only admins can assign and remove staff roles</li>
          <li>• Staff members can access the Staff View to manage orders</li>
          <li>• Users must be registered (signed up) before you can assign them staff roles</li>
          <li>• Contact the system administrator to get admin access</li>
        </ul>
      </div>
    </div>
  );
}