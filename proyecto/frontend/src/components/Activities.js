import { useState, useEffect } from "react";
import { fetchData, postData, putData, deleteData } from "../api";

export default function Activities() {
  const [activities, setActivities] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [form, setForm] = useState({ title: "", description: "", due_date: "", max_score: "", classroom_id: "" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", due_date: "", max_score: "", classroom_id: "" });

  useEffect(() => {
    fetchData("activities").then(setActivities);
    fetchData("classrooms").then(setClassrooms);
    fetchData("students").then(setStudents);
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    const newActivity = await postData("activities", form);
    if (newActivity) {
      setActivities([...activities, { id: newActivity.id, ...form }]);
      setForm({ title: "", description: "", due_date: "", max_score: "", classroom_id: "" });
    }
  };

  // ------------------ FUNCIONES CRUD ------------------
  const updateActivity = async (id, updatedData) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/activities/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
      });
      if (!res.ok) throw new Error("Failed to update activity");
      await res.json();

      // Actualizamos el estado usando la versión anterior
      setActivities(prev => prev.map(a => a.id === id ? { ...a, ...updatedData } : a));

      // Cerramos el formulario de edición y reseteamos editForm
      setEditingId(null);
      setEditForm({ title: "", description: "", due_date: "", max_score: "", classroom_id: "" });
    } catch (error) {
      console.error("Error updating activity:", error);
    }
  };

  const deleteActivity = async (id) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/activities/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setActivities(prev => prev.filter(a => a.id !== id));
      }
    } catch (error) {
      console.error("Error deleting activity:", error);
    }
  };

  // ------------------ FILTRADO POR ESTUDIANTE ------------------
  const filteredActivities = selectedStudent
    ? activities.filter(a => {
        const student = students.find(s => s.id === parseInt(selectedStudent));
        return student && a.classroom_id === student.classroom_id;
      })
    : activities;

  const displayedActivities = filteredActivities;

  return (
    <div>
      <h2>Activities</h2>

      <label>Select Student: </label>
      <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}>
        <option value="">-- All Students --</option>
        {students.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>

      <form onSubmit={handleSubmit}>
        <input name="title" placeholder="Title" value={form.title} onChange={handleChange} required />
        <input name="description" placeholder="Description" value={form.description} onChange={handleChange} />
        <input type="date" name="due_date" value={form.due_date} onChange={handleChange} required />
        <input type="number" name="max_score" placeholder="Max Score" value={form.max_score} onChange={handleChange} required />
        <select name="classroom_id" value={form.classroom_id} onChange={handleChange} required>
          <option value="">Select Classroom</option>
          {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button type="submit">Add Activity</button>
      </form>

      <ul>
        {displayedActivities.map(a => (
          <li key={a.id}>
            {editingId === a.id ? (
              <>
                <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
                <input value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                <input type="date" value={editForm.due_date} onChange={e => setEditForm({ ...editForm, due_date: e.target.value })} />
                <input type="number" value={editForm.max_score} onChange={e => setEditForm({ ...editForm, max_score: e.target.value })} />
                <select value={editForm.classroom_id} onChange={e => setEditForm({ ...editForm, classroom_id: e.target.value })}>
                  {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button onClick={() => updateActivity(a.id, editForm)}>Save</button>
                <button onClick={() => setEditingId(null)}>Cancel</button>
              </>
            ) : (
              <>
                {a.title} ({a.description}) - Max: {a.max_score} - Classroom: {a.classroom_id}
                <button onClick={() => { setEditingId(a.id); setEditForm({ ...a }); }}>Edit</button>
                <button onClick={() => deleteActivity(a.id)}>Delete</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
