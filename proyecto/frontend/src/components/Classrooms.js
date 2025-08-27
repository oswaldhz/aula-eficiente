import { useState, useEffect } from "react";
import { fetchData, postData } from "../api";

export default function Classrooms() {
  const [classrooms, setClassrooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState({ name: "", description: "", teacher_id: "" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", teacher_id: "" });

  useEffect(() => {
    fetchData("classrooms").then(setClassrooms);
    fetchData("teachers").then(setTeachers);
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    const newClassroom = await postData("classrooms", form);
    setClassrooms([...classrooms, { id: newClassroom.id, ...form }]);
    setForm({ name: "", description: "", teacher_id: "" });
  };

  // -------------------- FUNCIONES CRUD --------------------

  const updateClassroom = async (id, updatedData) => {
    const res = await fetch(`http://127.0.0.1:5000/classrooms/${id}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData)
    });
    await res.json();
    setClassrooms(classrooms.map(c => c.id === id ? { ...c, ...updatedData } : c));
    setEditingId(null);
  };

  const deleteClassroom = async (id) => {
    const res = await fetch(`http://127.0.0.1:5000/classrooms/${id}/`, {
      method: "DELETE"
    });
    if (res.ok) {
      setClassrooms(classrooms.filter(c => c.id !== id));
    }
  };

  return (
    <div>
      <h2>Classrooms</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
        <input name="description" placeholder="Description" value={form.description} onChange={handleChange} />
        <select name="teacher_id" value={form.teacher_id} onChange={handleChange} required>
          <option value="">Select teacher</option>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button type="submit">Add Classroom</button>
      </form>

      <ul>
        {classrooms.map(c => (
          <li key={c.id}>
            {editingId === c.id ? (
              <>
                <input
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                />
                <input
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                />
                <select
                  value={editForm.teacher_id}
                  onChange={e => setEditForm({ ...editForm, teacher_id: e.target.value })}
                >
                  <option value="">Select teacher</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <button onClick={() => updateClassroom(c.id, editForm)}>Save</button>
                <button onClick={() => setEditingId(null)}>Cancel</button>
              </>
            ) : (
              <>
                {c.name} - {c.description} - Teacher ID: {c.teacher_id}
                <button onClick={() => { setEditingId(c.id); setEditForm({ name: c.name, description: c.description, teacher_id: c.teacher_id }); }}>Edit</button>
                <button onClick={() => deleteClassroom(c.id)}>Delete</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
