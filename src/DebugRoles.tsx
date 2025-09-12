import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export function DebugRoles() {
  const isStaff = useQuery(api.staff.isCurrentUserStaff);
  const userRoles = useQuery(api.staff.getCurrentUserRoles);
  const anyAdminsExist = useQuery(api.staff.anyAdminsExist);
  const allRoles = useQuery(api.staff.getAllRolesDebug);
  
  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded text-xs max-w-sm">
      <h4 className="font-bold mb-2">Debug Info:</h4>
      <p>isStaff: {JSON.stringify(isStaff)}</p>
      <p>anyAdminsExist: {JSON.stringify(anyAdminsExist)}</p>
      <p>userRoles: {JSON.stringify(userRoles?.map(r => r.role))}</p>
      <p>allRoles in system: {JSON.stringify(allRoles?.map(r => r.role))}</p>
      <p>total roles count: {allRoles?.length}</p>
    </div>
  );
}