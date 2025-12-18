import { useEffect, useState } from "react";
import api from "../../api";

export default function AttendanceLocations() {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    const res = await api.get("/attendance/locations/");
    setLocations(res.data);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">
        Attendance → Rules & Locations
      </h2>

      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th>Location</th>
            <th>Grace</th>
            <th>OT Rule</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((l) => (
            <tr key={l.id} className="border-t">
              <td>{l.location_name}</td>
              <td>{l.grace_time} mins</td>
              <td>{l.ot_rule}</td>
              <td>{l.is_active ? "Active" : "Disabled"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

