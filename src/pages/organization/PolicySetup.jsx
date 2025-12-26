import { useEffect, useState } from "react";
import api from "../../api";

export default function PolicySetup() {
    const tenant_db = localStorage.getItem("tenant_db");

    const tabs = ["HR Policy", "Leave Policy", "Attendance Policy", "OT Policy"];
    const [activeTab, setActiveTab] = useState("HR Policy");

    // ---------------------- COMMON STATES ----------------------
    const [policies, setPolicies] = useState([]);
    const [editingId, setEditingId] = useState(null);

    // ---------------------- HR Policy ----------------------
    const [hrName, setHrName] = useState("");
    const [description, setDescription] = useState("");
    const [noticeDays, setNoticeDays] = useState("");
    const [probation, setProbation] = useState("");
    const [workWeek, setWorkWeek] = useState("Mon-Fri");
    const [holidayPattern, setHolidayPattern] = useState("Based on Holiday Calendar");
    const [policyFile, setPolicyFile] = useState(null);
    const [statusHR, setStatusHR] = useState("Active");

    // ---------------------- Leave Policy ----------------------
    const [leaveName, setLeaveName] = useState("");
    const [annual, setAnnual] = useState("");
    const [sick, setSick] = useState("");
    const [casual, setCasual] = useState("");
    const [carry, setCarry] = useState(true);
    const [carryMax, setCarryMax] = useState("");
    const [encash, setEncash] = useState(true);
    const [rule, setRule] = useState("Full Day");
    const [statusLeave, setStatusLeave] = useState("Active");

    // ---------------------- Attendance Policy ----------------------
const [attName, setAttName] = useState("");
const [checkStart, setCheckStart] = useState("");
const [checkEnd, setCheckEnd] = useState("");
const [checkout, setCheckout] = useState("");
const [grace, setGrace] = useState("");
const [lateMax, setLateMax] = useState("");
const [lateConvert, setLateConvert] = useState("1 Half Day after 3 late marks");
const [halfHours, setHalfHours] = useState("");
const [fullHours, setFullHours] = useState("");
const [weeklyOff, setWeeklyOff] = useState("Sat & Sun");
const [statusAtt, setStatusAtt] = useState("Active");


    // ---------------------- OT Policy ----------------------
    const [otName, setOtName] = useState("");
    const [basis, setBasis] = useState("Hourly");
    const [rate, setRate] = useState("1.5x");
    const [minOT, setMinOT] = useState("");
    const [maxOT, setMaxOT] = useState("");
    const [eligibleGrades, setEligibleGrades] = useState([]);
    const [autoOT, setAutoOT] = useState(true);
    const [statusOT, setStatusOT] = useState("Active");
    const [availableGrades, setAvailableGrades] = useState([]);

    // ---------------------- Load Policies ----------------------
    useEffect(() => {
        fetchPolicies();
        if(activeTab==="OT Policy") fetchGrades();
    }, [activeTab]);

    const fetchGrades = async () => {
        console.log('Fetching grades for OT Policy...');
        try {
            const res = await api.get('/grades/');
            console.log('Grades fetched:', res.data);
            setAvailableGrades(res.data || []);
        } catch (err) {
            console.error('Error fetching grades:', err);
        }
    };

    const fetchPolicies = async () => {
        console.log(`Fetching policies for ${activeTab}...`);
        try {
            let endpoint = "";
            if(activeTab==="HR Policy") endpoint = "/policies/hr/list";
            else if(activeTab==="Leave Policy") endpoint = "/policies/leave/list";
            else if(activeTab==="Attendance Policy") endpoint = "/policies/attendance/list";
            else if(activeTab==="OT Policy") endpoint = "/policies/ot/list";
            
            const res = await api.get(endpoint);
            console.log(`${activeTab} policies fetched:`, res.data);
            setPolicies(res.data || []);
        } catch (err) {
            console.error(`Error fetching ${activeTab}:`, err);
        }
    };

    // ---------------------- Save Policy ----------------------
    const savePolicy = async () => {
        const payload = buildPayload();
        console.log(`Saving ${activeTab}:`, payload);
        let endpoint = "";
        
        if(activeTab==="HR Policy") endpoint = editingId ? `/policies/hr/update/${editingId}` : "/policies/hr/create";
        else if(activeTab==="Leave Policy") endpoint = editingId ? `/policies/leave/update/${editingId}` : "/policies/leave/create";
        else if(activeTab==="Attendance Policy") endpoint = editingId ? `/policies/attendance/update/${editingId}` : "/policies/attendance/create";
        else if(activeTab==="OT Policy") endpoint = editingId ? `/policies/ot/update/${editingId}` : "/policies/ot/create";

        try {
            let policyId = editingId;
            if (editingId) {
                await api.put(endpoint, payload);
                console.log(`${activeTab} updated successfully`);
            } else {
                const res = await api.post(endpoint, payload);
                policyId = res.data.id;
                console.log(`${activeTab} created successfully`);
            }

            // Upload file for HR Policy
            if(activeTab==="HR Policy" && policyFile) {
                const formData = new FormData();
                formData.append('file', policyFile);
                await api.post(`/policies/hr/upload/${policyId}`, formData, {
                    headers: {'Content-Type': 'multipart/form-data'}
                });
                console.log('Document uploaded successfully');
            }

            alert(editingId ? "Updated Successfully" : "Saved Successfully");
            resetForm();
            fetchPolicies();
        } catch (err) {
            console.error(`Error saving ${activeTab}:`, err);
            alert(err.response?.data?.detail || "Failed");
        }
    };

    function buildPayload(){
        if(activeTab==="HR Policy"){
            return {
                name: hrName, description, notice_days:noticeDays, probation_period:probation,
                work_week:workWeek, holiday_pattern:holidayPattern, status:statusHR
            }
        }
        if(activeTab==="Leave Policy"){
            return {
                name: leaveName, annual, sick, casual,
                carry_forward:carry, max_carry:carryMax,
                encashment:encash, rule, status:statusLeave
            }
        }
        if(activeTab==="Attendance Policy"){
            return {
                name:attName, checkin_start:checkStart, checkin_end:checkEnd,
                checkout_time:checkout, grace, lateMax,
                lateConvert, halfHours, fullHours,
                weeklyOff, status:statusAtt
            }
        }
        if(activeTab==="OT Policy"){
            return {
                name:otName,basis,rate,minOT,maxOT,
                grades:eligibleGrades,autoOT,status:statusOT
            }
        }
    }

    const resetForm = () => {
        setEditingId(null);
        if(activeTab==="HR Policy"){
            setHrName(""); setDescription(""); setNoticeDays(""); setProbation("");
            setWorkWeek("Mon-Fri"); setHolidayPattern("Based on Holiday Calendar"); setPolicyFile(null); setStatusHR("Active");
        }
        else if(activeTab==="Leave Policy"){
            setLeaveName(""); setAnnual(""); setSick(""); setCasual("");
            setCarry(true); setCarryMax(""); setEncash(true); setRule("Full Day"); setStatusLeave("Active");
        }
        else if(activeTab==="Attendance Policy"){
            setAttName(""); setCheckStart(""); setCheckEnd(""); setCheckout("");
            setGrace(""); setLateMax(""); setLateConvert("1 Half Day after 3 late marks");
            setHalfHours(""); setFullHours(""); setWeeklyOff("Sat & Sun"); setStatusAtt("Active");
        }
        else if(activeTab==="OT Policy"){
            setOtName(""); setBasis("Hourly"); setRate("1.5x"); setMinOT(""); setMaxOT("");
            setEligibleGrades([]); setAutoOT(true); setStatusOT("Active");
        }
    };

    const loadForEdit = (policy) => {
        console.log(`Loading ${activeTab} for edit:`, policy);
        setEditingId(policy.id);
        if(activeTab==="HR Policy"){
            setHrName(policy.name||''); setDescription(policy.description||''); setNoticeDays(policy.notice_days||''); setProbation(policy.probation_period||'');
            setWorkWeek(policy.work_week||'Mon-Fri'); setHolidayPattern(policy.holiday_pattern||'Based on Holiday Calendar');
            setPolicyFile(null); setStatusHR(policy.status||'Active');
        }
        else if(activeTab==="Leave Policy"){
            setLeaveName(policy.name||''); setAnnual(policy.annual||''); setSick(policy.sick||''); setCasual(policy.casual||'');
            setCarry(policy.carry_forward); setCarryMax(policy.max_carry||''); setEncash(policy.encashment);
            setRule(policy.rule||'Full Day'); setStatusLeave(policy.status||'Active');
        }
        else if(activeTab==="Attendance Policy"){
            setAttName(policy.name||''); setCheckStart(policy.checkin_start||''); setCheckEnd(policy.checkin_end||''); setCheckout(policy.checkout_time||'');
            setGrace(policy.grace||''); setLateMax(policy.lateMax||''); setLateConvert(policy.lateConvert||'1 Half Day after 3 late marks');
            setHalfHours(policy.halfHours||''); setFullHours(policy.fullHours||''); setWeeklyOff(policy.weeklyOff||'Sat & Sun');
            setStatusAtt(policy.status||'Active');
        }
        else if(activeTab==="OT Policy"){
            setOtName(policy.name||''); setBasis(policy.basis||'Hourly'); setRate(policy.rate||'1.5x');
            setMinOT(policy.minOT||''); setMaxOT(policy.maxOT||''); setEligibleGrades(policy.grades||[]);
            setAutoOT(policy.autoOT); setStatusOT(policy.status||'Active');
        }
    };

    const deletePolicy = async (id) => {
        if(!confirm('Delete this policy?')) return;
        console.log(`Deleting ${activeTab} with id:`, id);
        let endpoint = "";
        if(activeTab==="HR Policy") endpoint = `/policies/hr/delete/${id}`;
        else if(activeTab==="Leave Policy") endpoint = `/policies/leave/delete/${id}`;
        else if(activeTab==="Attendance Policy") endpoint = `/policies/attendance/delete/${id}`;
        else if(activeTab==="OT Policy") endpoint = `/policies/ot/delete/${id}`;

        try {
            await api.delete(endpoint);
            console.log(`${activeTab} deleted successfully`);
            alert('Deleted Successfully');
            fetchPolicies();
        } catch (err) {
            console.error(`Error deleting ${activeTab}:`, err);
            alert(err.response?.data?.detail || 'Failed to delete');
        }
    };


    // ---------------------- UI SECTION ----------------------
    return (
        <div className="p-6 bg-content min-h-screen space-y-6">

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 mb-6">
                <span className="text-sm text-gray-600">Policy Types</span>
                <div className="flex items-center bg-gray-100 rounded-full p-1 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => {setActiveTab(tab); resetForm();}}
                            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${
                                activeTab === tab
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">

                {/* ---------------- LEFT: FORM ---------------- */}
                <div className="bg-white p-6 rounded-xl shadow-sm space-y-6">
                    <h2 className="text-xl font-semibold">{editingId?"Edit":"Create"} {activeTab}</h2>

                    {activeTab==="HR Policy" && <HRForm {...{hrName,setHrName,description,setDescription,noticeDays,setNoticeDays,probation,setProbation,
                    workWeek,setWorkWeek,holidayPattern,setHolidayPattern,policyFile,setPolicyFile,statusHR,setStatusHR}}/>}

                    {activeTab==="Leave Policy" && <LeaveForm {...{leaveName,setLeaveName,annual,setAnnual,sick,setSick,
                    casual,setCasual,carry,setCarry,carryMax,setCarryMax,encash,setEncash,rule,setRule,statusLeave,setStatusLeave}}/>}

                    {activeTab==="Attendance Policy" && <AttendanceForm {...{attName,setAttName,checkStart,setCheckStart,checkEnd,setCheckEnd,
                    checkout,setCheckout,grace,setGrace,lateMax,setLateMax,lateConvert,setLateConvert,
                    halfHours,setHalfHours,fullHours,setFullHours,weeklyOff,setWeeklyOff,statusAtt,setStatusAtt}}/>}

                    {activeTab==="OT Policy" && <OTForm {...{otName,setOtName,basis,setBasis,rate,setRate,minOT,setMinOT,
                    maxOT,setMaxOT,eligibleGrades,setEligibleGrades,autoOT,setAutoOT,statusOT,setStatusOT,availableGrades}}/>}

                    <div className="flex justify-end gap-3">
                        <button onClick={resetForm} className="border px-5 py-2 rounded-lg" style={{borderColor: 'var(--border-color, #e2e8f0)'}}>Reset</button>
                        <button onClick={savePolicy} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Save</button>
                    </div>
                </div>

                {/* ---------------- RIGHT: LIST TABLE ---------------- */}
                <div className="p-6 rounded-xl shadow-sm" style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}>
                    <PolicyTable policies={policies} onEdit={loadForEdit} onDelete={deletePolicy} activeTab={activeTab}/>
                </div>

            </div>
        </div>
    );
}


// ---------------- COMPONENT FORMS BELOW (All Tailwind same UI style) ----------------

function HRForm(props){
    const {hrName,setHrName,noticeDays,setNoticeDays,probation,setProbation,
        workWeek,setWorkWeek,holidayPattern,setHolidayPattern,statusHR,setStatusHR,
        description,setDescription,policyFile,setPolicyFile}=props

    return(<>
        <input className="border p-2 w-full rounded" style={{borderColor: 'var(--border-color, #e2e8f0)'}} placeholder="Policy Name" value={hrName} onChange={e=>setHrName(e.target.value)}/>
        <textarea className="border p-2 w-full rounded" style={{borderColor: 'var(--border-color, #e2e8f0)'}} rows="3" placeholder="Policy Description"
            value={description} onChange={e=>setDescription(e.target.value)}/>
        <input className="border p-2 w-full rounded" style={{borderColor: 'var(--border-color, #e2e8f0)'}} placeholder="Notice Period (Days)" type="number" value={noticeDays} onChange={e=>setNoticeDays(e.target.value)}/>
        <input className="border p-2 w-full rounded" style={{borderColor: 'var(--border-color, #e2e8f0)'}} placeholder="Probation Period (Days)" type="number" value={probation} onChange={e=>setProbation(e.target.value)}/>
        
        <div>
            <label className="block text-sm text-secondary mb-1">Work Week</label>
            <select className="border p-2 w-full rounded" style={{borderColor: 'var(--border-color, #e2e8f0)'}} value={workWeek} onChange={e=>setWorkWeek(e.target.value)}>
                <option>Mon-Fri</option><option>Mon-Sat</option><option>Custom</option>
            </select>
        </div>
        
        <div>
            <label className="block text-sm text-secondary mb-1">Holiday Pattern</label>
            <select className="border p-2 w-full rounded" style={{borderColor: 'var(--border-color, #e2e8f0)'}} value={holidayPattern} onChange={e=>setHolidayPattern(e.target.value)}>
                <option>Based on Holiday Calendar</option><option>Custom</option>
            </select>
        </div>
        
        <div>
            <label className="block text-sm text-secondary mb-1">Upload Policy Document (PDF)</label>
            <input type="file" accept=".pdf" className="border p-2 w-full rounded" style={{borderColor: 'var(--border-color, #e2e8f0)'}} 
                onChange={e=>setPolicyFile(e.target.files[0])}/>
        </div>
        
        <select className="border p-2 w-full rounded" style={{borderColor: 'var(--border-color, #e2e8f0)'}} value={statusHR} onChange={e=>setStatusHR(e.target.value)}>
            <option>Active</option><option>Inactive</option>
        </select>
    </>)
}

function LeaveForm(props){
    const {leaveName,setLeaveName,annual,setAnnual,sick,setSick,casual,setCasual,
        carry,setCarry,carryMax,setCarryMax,encash,setEncash,rule,setRule,statusLeave,setStatusLeave}=props

    return(<>
        <input className="border p-2 w-full rounded" style={{borderColor: 'var(--border-color, #e2e8f0)'}} placeholder="Policy Name" value={leaveName} onChange={e=>setLeaveName(e.target.value)}/>
        <input className="border p-2 rounded" style={{borderColor: 'var(--border-color, #e2e8f0)'}} placeholder="Annual Leave Count" type="number" value={annual} onChange={e=>setAnnual(e.target.value)}/>
        <input className="border p-2 rounded" style={{borderColor: 'var(--border-color, #e2e8f0)'}} placeholder="Sick Leave Count" type="number" value={sick} onChange={e=>setSick(e.target.value)}/>
        <input className="border p-2 rounded" style={{borderColor: 'var(--border-color, #e2e8f0)'}} placeholder="Casual Leave Count" type="number" value={casual} onChange={e=>setCasual(e.target.value)}/>

        <label className="flex gap-2 items-center text-sm"><input type="checkbox" checked={carry} onChange={e=>setCarry(e.target.checked)}/> Carry Forward Allowed</label>
        {carry && <input className="border p-2 w-full rounded" style={{borderColor: 'var(--border-color, #e2e8f0)'}} placeholder="Max Carry Forward Days" type="number" value={carryMax} onChange={e=>setCarryMax(e.target.value)}/>}

        <label className="flex gap-2 items-center text-sm"><input type="checkbox" checked={encash} onChange={e=>setEncash(e.target.checked)}/> Encashment Allowed</label>

        <select className="border p-2 w-full rounded" style={{borderColor: 'var(--border-color, #e2e8f0)'}} value={rule} onChange={e=>setRule(e.target.value)}>
            <option>Full Day</option><option>Half Day</option><option>Pro-rata</option>
        </select>

        <p className="text-xs text-muted">LOP applied automatically if leave balance not available.</p>

        <select className="border p-2 w-full rounded" style={{borderColor: 'var(--border-color, #e2e8f0)'}} value={statusLeave} onChange={e=>setStatusLeave(e.target.value)}>
            <option>Active</option><option>Inactive</option>
        </select>
    </>)
}

function AttendanceForm(props){
    const {attName,setAttName,checkStart,setCheckStart,checkEnd,setCheckEnd,checkout,setCheckout,
        grace,setGrace,lateMax,setLateMax,lateConvert,setLateConvert,
        halfHours,setHalfHours,fullHours,setFullHours,weeklyOff,setWeeklyOff,statusAtt,setStatusAtt}=props

    return(<>
        <input className="border p-2 w-full rounded" style={{borderColor: 'var(--border-color, #e2e8f0)'}} placeholder="Policy Name" value={attName} onChange={e=>setAttName(e.target.value)}/>
        
        <div>
            <label className="block text-xs text-secondary mb-1">Check-in Start (e.g., 8:00 AM)</label>
            <input className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}} type="time" value={checkStart} onChange={e=>setCheckStart(e.target.value)}/>
        </div>
        
        <div>
            <label className="block text-xs text-secondary mb-1">Check-in End (Latest time to check-in)</label>
            <input className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}} type="time" value={checkEnd} onChange={e=>setCheckEnd(e.target.value)}/>
        </div>
        
        <div>
            <label className="block text-xs text-secondary mb-1">Check-out Time (e.g., 5:00 PM)</label>
            <input className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}} type="time" value={checkout} onChange={e=>setCheckout(e.target.value)}/>
        </div>
        
        <input className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}} placeholder="Grace Minutes" type="number" value={grace} onChange={e=>setGrace(e.target.value)}/>
        <input className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}} placeholder="Max Late per Month" type="number" value={lateMax} onChange={e=>setLateMax(e.target.value)}/>
        <select className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}} value={lateConvert} onChange={e=>setLateConvert(e.target.value)}>
            <option>1 Half Day after 3 late marks</option><option>1 Full Day</option>
        </select>
        <input className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}} placeholder="Min Hours for Half-Day" type="number" value={halfHours} onChange={e=>setHalfHours(e.target.value)}/>
        <input className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}} placeholder="Full Day Required Hours" type="number" value={fullHours} onChange={e=>setFullHours(e.target.value)}/>
        <select className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}} value={weeklyOff} onChange={e=>setWeeklyOff(e.target.value)}>
            <option>Sat & Sun</option><option>Sunday Only</option><option>Custom</option>
        </select>
        <select className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}} value={statusAtt} onChange={e=>setStatusAtt(e.target.value)}>
            <option>Active</option><option>Inactive</option>
        </select>
    </>)
}

function OTForm(props){
    const {otName,setOtName,basis,setBasis,rate,setRate,minOT,setMinOT,
        maxOT,setMaxOT,eligibleGrades,setEligibleGrades,autoOT,setAutoOT,statusOT,setStatusOT,availableGrades}=props

    const addGrade = (g)=>g && !eligibleGrades.includes(g)&&setEligibleGrades([...eligibleGrades,g])
    const remove = g=>setEligibleGrades(eligibleGrades.filter(x=>x!==g))

    return(<>
        <input className="border p-2 w-full rounded" style={{borderColor: 'var(--border-color, #e2e8f0)'}} placeholder="Policy Name" value={otName} onChange={e=>setOtName(e.target.value)}/>
        <select className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}} value={basis} onChange={e=>setBasis(e.target.value)}>
            <option>Hourly</option><option>Daily</option>
        </select>
        <select className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}} value={rate} onChange={e=>setRate(e.target.value)}>
            <option>1.5x</option><option>2x</option><option>Custom</option>
        </select>
        <input className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}} placeholder="Min OT Hours" value={minOT} onChange={e=>setMinOT(e.target.value)}/>
        <input className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}} placeholder="Max OT Per Day" value={maxOT} onChange={e=>setMaxOT(e.target.value)}/>

        <p className="text-xs mb-1 text-secondary">Eligible Grades:</p>
        <div className="flex flex-wrap gap-2">
            {eligibleGrades.map(g=>(
                <span key={g} className="px-3 py-1 bg-blue-100 rounded-full text-xs flex items-center gap-1">
                    {g} <button onClick={()=>remove(g)}>✕</button>
                </span>
            ))}
        </div>

        <select className="border p-2 rounded w-full" style={{borderColor: 'var(--border-color, #e2e8f0)'}} value="" onChange={e=>addGrade(e.target.value)}>
            <option value="">Select Grade</option>
            {availableGrades.map(g=><option key={g.id} value={g.code}>{g.name} ({g.code})</option>)}
        </select>

        <label className="flex gap-2 items-center text-sm mt-2">
            <input type="checkbox" checked={autoOT} onChange={e=>setAutoOT(e.target.checked)}/> Auto OT Approval
        </label>

        <select className="border p-2 rounded w-full mt-2" style={{borderColor: 'var(--border-color, #e2e8f0)'}} value={statusOT} onChange={e=>setStatusOT(e.target.value)}>
            <option>Active</option><option>Inactive</option>
        </select>
    </>)
}


// ---------------- Policy Table ----------------
function PolicyTable({policies, onEdit, onDelete, activeTab}){
    return (
        <table style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="min-w-full text-sm border">
            <thead style={{borderColor: 'var(--border-color, #e2e8f0)'}} className="bg-gray-100 text-secondary">
                <tr>
                    <th className="border p-3 text-left" style={{borderColor: 'var(--border-color, #e2e8f0)'}}>Policy Name</th>
                    <th className="border p-3 text-left" style={{borderColor: 'var(--border-color, #e2e8f0)'}}>Status</th>
                    {activeTab==="HR Policy" && <th className="border p-3 text-center" style={{borderColor: 'var(--border-color, #e2e8f0)'}}>Document</th>}
                    <th className="border p-3 text-center" style={{borderColor: 'var(--border-color, #e2e8f0)'}}>Actions</th>
                </tr>
            </thead>

            <tbody style={{borderColor: 'var(--border-color, #e2e8f0)'}}>
                {policies.length===0 ? (
                    <tr><td colSpan={activeTab==="HR Policy"?"4":"3"} className="text-center p-3 text-muted">No records found</td></tr>
                ) : policies.map(p=>(
                    <tr key={p.id}>
                        <td className="border p-3" style={{borderColor: 'var(--border-color, #e2e8f0)'}}>{p.name}</td>
                        <td className="border p-3" style={{borderColor: 'var(--border-color, #e2e8f0)'}}>{p.status}</td>
                        {activeTab==="HR Policy" && (
                            <td className="border p-3 text-center" style={{borderColor: 'var(--border-color, #e2e8f0)'}}>
                                {p.document_download_url ? (
                                    <a href={`http://localhost:8000${p.document_download_url}`} target="_blank" rel="noreferrer" 
                                       className="text-blue-600 text-xs hover:underline">Download PDF</a>
                                ) : (
                                    <span className=" text-xs" style={{color: 'var(--text-muted, #6b7280)'}}>No document</span>
                                )}
                            </td>
                        )}
                        <td className="border p-3 text-center space-x-3" style={{borderColor: 'var(--border-color, #e2e8f0)'}}>
                            <button onClick={()=>onEdit(p)} className="text-blue-600 text-xs hover:underline">Edit</button>
                            <button onClick={()=>onDelete(p.id)} className="text-red-600 text-xs hover:underline">Delete</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
