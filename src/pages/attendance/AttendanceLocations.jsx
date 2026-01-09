import { useEffect, useState } from "react";
import api from "../../api";
import useToast from "../../utils/useToast";
import Toast from "../../components/Toast";

export default function AttendanceLocations() {
  const [locations, setLocations] = useState([]);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const res = await api.get("/attendance/locations/");
      setLocations(res.data);
      showToast("Locations loaded successfully", "success");
    } catch (error) {
      console.error("Failed to load locations:", error);
      showToast("Failed to load locations", "error");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">
        Attendance → Rules & Locations
      </h2>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="w-full border text-sm">
          <thead style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left">Location</th>
              <th className="px-4 py-3 text-left">Grace</th>
              <th className="px-4 py-3 text-left">OT Rule</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody style={{borderColor: 'var(--border-color, #e2e8f0)'}}>
            {locations.map((l) => (
              <tr key={l.id} className="border-t hover:bg-gray-50" style={{borderColor: 'var(--border-color, #e2e8f0)'}}>
                <td className="px-4 py-3">{l.location_name}</td>
                <td className="px-4 py-3">{l.grace_time} mins</td>
                <td className="px-4 py-3">{l.ot_rule}</td>
                <td className="px-4 py-3">{l.is_active ? "Active" : "Disabled"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {locations.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No locations found</p>
          </div>
        ) : (
          locations.map((l) => (
            <div key={l.id} className="p-4 border-b border-gray-200 hover:bg-gray-50">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-900">Location:</span>
                  <span className="text-sm text-gray-600">{l.location_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-900">Grace:</span>
                  <span className="text-sm text-gray-600">{l.grace_time} mins</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-900">OT Rule:</span>
                  <span className="text-sm text-gray-600">{l.ot_rule}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-900">Status:</span>
                  <span className="text-sm text-gray-600">{l.is_active ? "Active" : "Disabled"}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <Toast toast={toast} hideToast={hideToast} />
    </div>
  );
}

