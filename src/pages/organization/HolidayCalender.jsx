import { useEffect, useState } from "react";
import api from "../../api";

export default function HolidayCalendar() {
  const tenant_db = localStorage.getItem("tenant_db");

  // ---------------- STATE ----------------
  const [holidayName, setHolidayName] = useState("");
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayType, setHolidayType] = useState("Festival");
  const [description, setDescription] = useState("");
  const [repeat, setRepeat] = useState(true);
  const [status, setStatus] = useState("Active");

  const [holidays, setHolidays] = useState([]);

  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const [editingId, setEditingId] = useState(null);

  const years = [2024, 2025, 2026, 2027, 2028];

  // ---------------- LOAD HOLIDAYS ----------------
  useEffect(() => {
    fetchHolidays();
  }, [yearFilter, typeFilter]);

  const fetchHolidays = async () => {
    try {
      console.log('Fetching holidays list');
      const res = await api.get(`/holidays/list`);
      console.log('Holidays loaded:', res.data);
      let data = res.data || [];

      // Filter by year
      data = data.filter(h => h.date.startsWith(yearFilter.toString()));

      // Filter by type
      if (typeFilter !== "All") data = data.filter(h => h.type === typeFilter);

      // Search filter
      if (search.trim() !== "")
        data = data.filter(h => h.name.toLowerCase().includes(search.toLowerCase()));

      setHolidays(data);
    } catch {}
  };

  // ---------------- SAVE ----------------
  const saveHoliday = async () => {
    if (!holidayName || !holidayDate)
      return alert("Holiday name and date required");

    try {
      console.log(editingId ? `Updating holiday ID: ${editingId}` : 'Creating holiday');
      
      const payload = {
        name: holidayName,
        date: holidayDate,
        type: holidayType,
        description,
        repeat_yearly: repeat, 
        status,
      };

      if (editingId) {
        await api.put(`/holidays/update/${editingId}`, payload);
      } else {
        await api.post(`/holidays/create`, payload);
      }

      console.log(editingId ? 'Holiday updated successfully' : 'Holiday created successfully');
      alert(editingId ? "Holiday updated successfully!" : "Holiday saved successfully!");
      resetForm();
      fetchHolidays();
    } catch (err) {
      console.error('Save holiday failed:', err);
      alert(err.response?.data?.detail || "Save failed");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setHolidayName("");
    setHolidayDate("");
    setHolidayType("Festival");
    setDescription("");
    setRepeat(true);
    setStatus("Active");
  };

  // ---------------- EDIT ----------------
  const loadHolidayForEdit = (holiday) => {
    console.log('Loading holiday for edit:', holiday);
    setEditingId(holiday.id);
    setHolidayName(holiday.name);
    setHolidayDate(holiday.date);
    setHolidayType(holiday.type);
    setDescription(holiday.description || "");
    setRepeat(holiday.repeat_yearly);
    setStatus(holiday.status);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ---------------- DELETE ----------------
  const deleteHoliday = async (id) => {
    if (!window.confirm("Delete this holiday?")) return;

    try {
      console.log(`Deleting holiday with ID: ${id}`);
      await api.delete(`/holidays/delete/${id}`);
      console.log('Holiday deleted successfully');
      alert("Holiday deleted successfully!");
      fetchHolidays();
    } catch (err) {
      console.error('Delete holiday failed:', err);
      alert(err.response?.data?.detail || "Delete failed");
    }
  };


  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* GRID LAYOUT */}
      <div className="grid grid-cols-2 gap-6">

        {/* ---------------- LEFT: FORM CARD ---------------- */}
        <div className="bg-white p-6 rounded-xl shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-semibold">{editingId ? 'Edit Holiday' : 'Create Holiday'}</h2>
          <p className="text-gray-500 text-sm">Add official company holidays.</p>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-2 gap-4">
          <input className="border rounded p-2" placeholder="Holiday Name"
            value={holidayName} onChange={e=>setHolidayName(e.target.value)} />

          <input type="date" className="border rounded p-2"
            value={holidayDate} onChange={e=>setHolidayDate(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <select className="border rounded p-2"
            value={holidayType} onChange={e=>setHolidayType(e.target.value)}>
            <option>National</option>
            <option>Public</option>
            <option>Festival</option>
            <option>Optional</option>
            <option>Company</option>
          </select>

          <select className="border rounded p-2"
            value={status} onChange={e=>setStatus(e.target.value)}>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>

        <textarea className="border rounded p-2 w-full" rows="3"
          placeholder="Description (optional)"
          value={description} onChange={e=>setDescription(e.target.value)} />

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={repeat}
            onChange={e=>setRepeat(e.target.checked)} />
          Repeat Every Year
        </label>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button className="border px-5 py-2 rounded-lg" onClick={resetForm}>
            Reset
          </button>
          <button onClick={saveHoliday}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            {editingId ? 'Update Holiday' : 'Save Holiday'}
          </button>
        </div>
        </div>

        {/* ---------------- RIGHT: LIST TABLE ---------------- */}
        <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
        
        {/* Filters */}
        <div className="flex gap-4 items-center mb-4">
          <select className="border p-2 rounded"
            value={yearFilter} onChange={e=>setYearFilter(e.target.value)}>
            {years.map(y=><option key={y}>{y}</option>)}
          </select>

          <input className="border p-2 rounded w-56" placeholder="Search holiday"
            value={search} onChange={e=>setSearch(e.target.value)} />

          <select className="border p-2 rounded"
            value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
            <option>All</option>
            <option>National</option>
            <option>Public</option>
            <option>Festival</option>
            <option>Optional</option>
            <option>Company</option>
          </select>
        </div>

        {/* Table */}
        <table className="min-w-full text-sm border">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="border p-3 text-left">Date</th>
              <th className="border p-3 text-left">Holiday Name</th>
              <th className="border p-3 text-left">Type</th>
              <th className="border p-3 text-left">Status</th>
              <th className="border p-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {holidays.length === 0 ? (
              <tr><td colSpan="5" className="text-center p-3 text-gray-400">No holidays found</td></tr>
            ) : holidays.map(h=>(
              <tr key={h.id}>
                <td className="border p-3">{new Date(h.date).toLocaleDateString()}</td>
                <td className="border p-3">{h.name}</td>
                <td className="border p-3">{h.type}</td>
                <td className="border p-3">{h.status}</td>
                <td className="border p-3 text-center space-x-3">
                  <button 
                    onClick={() => loadHolidayForEdit(h)}
                    className="text-blue-600 text-xs hover:underline">Edit</button>
                  <button 
                    onClick={() => deleteHoliday(h.id)}
                    className="text-red-600 text-xs hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        </div>

      </div>

    </div>
  );
}
