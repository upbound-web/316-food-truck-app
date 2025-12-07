import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";

export function AdminPanel() {
  const [userEmail, setUserEmail] = useState("");
  const [showStaffList, setShowStaffList] = useState(false);
  
  const staffUsers = useQuery(api.staff.getAllStaffUsers);
  const currentUserRoles = useQuery(api.staff.getCurrentUserRoles);
  const assignStaffRole = useMutation(api.staff.assignStaffRole);
  const removeStaffRole = useMutation(api.staff.removeStaffRole);
  const makeFirstUserAdmin = useMutation(api.staff.makeFirstUserAdmin);
  const promoteToAdmin = useMutation(api.staff.promoteToAdmin);
  const demoteToStaff = useMutation(api.staff.demoteToStaff);

  // Get current user's ID to prevent self-demotion in UI
  const currentUserId = currentUserRoles?.[0]?.userId;
  
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

  const handlePromoteToAdmin = async (userId: string) => {
    try {
      await promoteToAdmin({ userId: userId as any });
      toast.success("User promoted to admin successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to promote user");
    }
  };

  const handleDemoteToStaff = async (userId: string) => {
    try {
      await demoteToStaff({ userId: userId as any });
      toast.success("User demoted to staff successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to demote user");
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
                        Role: <span className={`font-medium capitalize ${staffMember.role === "admin" ? "text-blue-600" : "text-green-600"}`}>
                          {staffMember.role}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Assigned: {new Date(staffMember.assignedAt).toLocaleDateString()}
                        {staffMember.assignedByUser && (
                          <span> by {staffMember.assignedByUser.name || staffMember.assignedByUser.email}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {staffMember.role === "staff" && (
                        <>
                          <button
                            onClick={() => handlePromoteToAdmin(staffMember.userId)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                          >
                            Make Admin
                          </button>
                          <button
                            onClick={() => handleRemoveStaff(staffMember.userId)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                          >
                            Remove
                          </button>
                        </>
                      )}
                      {staffMember.role === "admin" && (
                        <>
                          {staffMember.userId !== currentUserId ? (
                            <button
                              onClick={() => handleDemoteToStaff(staffMember.userId)}
                              className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
                            >
                              Demote to Staff
                            </button>
                          ) : (
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded font-medium">
                              You (Admin)
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">Role Management</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Staff</strong> can manage orders and products</li>
          <li>• <strong>Admin</strong> can do everything staff can, plus manage user roles</li>
          <li>• Admins can promote staff to admin or demote admins to staff</li>
          <li>• You cannot demote yourself (safety feature)</li>
          <li>• Users must be registered before you can assign them roles</li>
        </ul>
      </div>
    </div>
  );
}