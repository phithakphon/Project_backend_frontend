
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";

const API_URL =
    process.env.REACT_APP_API_URL || "http://localhost:8080";

function PokemonManagement() {
    const [pokemon, setPokemon] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [showAddForm, setShowAddForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const initialPokemon = {
        id: "",
        name: "",
        api_name: "",
        image_url: "",
        height: "",
        weight: "",
        description: "",
        types: [],
        stats: {
            hp: 0,
            attack: 0,
            defense: 0,
            special_attack: 0,
            special_defense: 0,
            speed: 0,
        },
    };

    const [newPokemon, setNewPokemon] = useState(initialPokemon);

    const handleEdit = async (id) => {
        

        try {
            const response = await fetch(`${API_URL}/api/pokemon/${id}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error("ไม่สามารถโหลดข้อมูล Pokémon ได้");
            }

            const item = data.pokemon || data;

            setNewPokemon({
                id: item.id,
                name: item.name || "",
                api_name: item.api_name || "",
                image_url: item.image_url || "",
                height: item.height ?? "",
                weight: item.weight ?? "",
                description: item.description || "",
                types: item.types || [],
                stats: {
                    hp: item.stats?.hp ?? 0,
                    attack: item.stats?.attack ?? 0,
                    defense: item.stats?.defense ?? 0,
                    special_attack: item.stats?.special_attack ?? 0,
                    special_defense: item.stats?.special_defense ?? 0,
                    speed: item.stats?.speed ?? 0,
                },
            });

            setEditingId(id);
            setShowAddForm(true);
        } catch (err) {
            alert(err.message);
        }
    };
   
    // ลบ Pokémon
    const handleDelete = async (id, name) => {
        const confirmed = window.confirm(
            `คุณต้องการลบ ${name} ออกจากระบบใช่หรือไม่?`
        );

        if (!confirmed) return;

        const token = localStorage.getItem("token");

        if (!token) {
            alert("กรุณาเข้าสู่ระบบก่อน");
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/api/admin/pokemon/${id}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                const result = await response.text();
                throw new Error(result || "ไม่สามารถลบ Pokémon ได้");
            }

            setPokemon((prev) =>
                prev.filter((item) => item.id !== id)
            );

            alert(`ลบ ${name} สำเร็จ!`);
        } catch (err) {
            alert(err.message);
        }
    };


    // จัดการข้อมูลในช่องกรอก
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name.startsWith("stats.")) {
            const statName = name.split(".")[1];

            setNewPokemon((prev) => ({
                ...prev,
                stats: {
                    ...prev.stats,
                    [statName]: Number(value),
                },
            }));
            return;
        }

        setNewPokemon((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // เลือกประเภท Pokémon
    const handleTypeChange = (type) => {
        setNewPokemon((prev) => ({
            ...prev,
            types: prev.types.includes(type)
                ? prev.types.filter((item) => item !== type)
                : [...prev.types, type],
        }));
    };

    // บันทึก Pokémon ลง Backend
    const handleSubmit = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("token");

        if (!token) {
            alert("กรุณาเข้าสู่ระบบก่อน");
            return;
        }

        if (
            !newPokemon.id ||
            !newPokemon.name.trim() ||
            !newPokemon.api_name.trim() ||
            !newPokemon.image_url.trim() ||
            !newPokemon.height ||
            !newPokemon.weight ||
            newPokemon.types.length === 0
        ) {
            alert("กรุณากรอกข้อมูลให้ครบและเลือกประเภท Pokémon");
            return;
        }

        const payload = {
            ...newPokemon,
            id: Number(newPokemon.id),
            height: Number(newPokemon.height),
            weight: Number(newPokemon.weight),
        };

        setSaving(true);

        try {

            const response = await fetch(
                editingId
                    ? `${API_URL}/api/admin/pokemon/${editingId}`
                    : `${API_URL}/api/admin/pokemon`,
                {
                    method: editingId ? "PUT" : "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                }
            );


            const result = await response.text();

            if (!response.ok) {
                throw new Error(result || "ไม่สามารถเพิ่ม Pokémon ได้");
            }

            alert(editingId ? "แก้ไข Pokémon สำเร็จ!" : "เพิ่ม Pokémon สำเร็จ!");
            setEditingId(null);

            setShowAddForm(false);
            setNewPokemon(initialPokemon);
            setError("");

            const refresh = await fetch(`${API_URL}/api/pokemon`);

            if (!refresh.ok) {
                throw new Error("เพิ่มสำเร็จ แต่โหลดรายการ Pokémon ใหม่ไม่สำเร็จ");
            }

            const data = await refresh.json();
            setPokemon(data.pokemon || []);
        } catch (err) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    // โหลด Pokémon
    useEffect(() => {
        async function loadPokemon() {
            try {
                const response = await fetch(`${API_URL}/api/pokemon`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error("ไม่สามารถโหลดข้อมูล Pokémon ได้");
                }

                setPokemon(data.pokemon || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadPokemon();
    }, []);

    const filteredPokemon = pokemon.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
    );

    const pokemonTypes = [
        "Normal", "Fire", "Water", "Electric", "Grass", "Ice",
        "Fighting", "Poison", "Ground", "Flying", "Psychic",
        "Bug", "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy",
    ];

    const statFields = [
        ["HP", "hp"],
        ["Attack", "attack"],
        ["Defense", "defense"],
        ["Special Attack", "special_attack"],
        ["Special Defense", "special_defense"],
        ["Speed", "speed"],
    ];

    return (
        <div className="admin-main">

            {/* ADD POKEMON MODAL */}
            {showAddForm && (
                <div className="pokemon-modal-overlay">
                    <form className="pokemon-modal" onSubmit={handleSubmit}>

                        <div className="pokemon-modal-header">
                            <div>
                                <span>POKÉDEX CONTROL CENTER</span>
                                <h2>{editingId ? "Edit Pokémon" : "Add New Pokémon"}</h2>
                                <p>
                                    {editingId
                                        ? "แก้ไขข้อมูล Pokémon ที่เลือก"
                                        : "กรอกข้อมูล Pokémon ที่ต้องการเพิ่ม"}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowAddForm(false)}
                                className="pokemon-modal-close"
                                disabled={saving}
                            >
                                ×
                            </button>
                        </div>

                        {/* BASIC INFORMATION */}
                        <div className="pokemon-form-grid">
                            <label>
                                Pokémon ID
                                <input
                                    name="id"
                                    type="number"
                                    min="1"
                                    value={newPokemon.id}
                                    onChange={handleInputChange}
                                    placeholder="เช่น 1001"
                                    required
                                />
                            </label>

                            <label>
                                Pokémon Name
                                <input
                                    name="name"
                                    value={newPokemon.name}
                                    onChange={handleInputChange}
                                    placeholder="เช่น Pikachu"
                                    required
                                />
                            </label>

                            <label>
                                API Name
                                <input
                                    name="api_name"
                                    value={newPokemon.api_name}
                                    onChange={handleInputChange}
                                    placeholder="เช่น pikachu"
                                    required
                                />
                            </label>

                            <label>
                                Image URL
                                <input
                                    name="image_url"
                                    type="url"
                                    value={newPokemon.image_url}
                                    onChange={handleInputChange}
                                    placeholder="https://..."
                                    required
                                />
                            </label>

                            <label>
                                Height
                                <input
                                    name="height"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={newPokemon.height}
                                    onChange={handleInputChange}
                                    placeholder="Height"
                                    required
                                />
                            </label>

                            <label>
                                Weight
                                <input
                                    name="weight"
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={newPokemon.weight}
                                    onChange={handleInputChange}
                                    placeholder="Weight"
                                    required
                                />
                            </label>
                        </div>

                        {/* DESCRIPTION */}
                        <label className="pokemon-form-description">
                            Description
                            <textarea
                                name="description"
                                value={newPokemon.description}
                                onChange={handleInputChange}
                                placeholder="รายละเอียด Pokémon..."
                            />
                        </label>

                        {/* POKEMON TYPES */}
                        <div className="pokemon-form-types">
                            <strong>Pokémon Types</strong>
                            <p>เลือกประเภทได้มากกว่า 1 ประเภท</p>

                            <div className="pokemon-type-options">
                                {pokemonTypes.map((type) => (
                                    <button
                                        type="button"
                                        key={type}
                                        disabled={saving}
                                        className={
                                            newPokemon.types.includes(type) ? "selected" : ""
                                        }
                                        onClick={() => handleTypeChange(type)}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* BASE STATS */}
                        <div className="pokemon-form-stats">
                            <strong>Base Stats</strong>
                            <p>กำหนดค่าสถานะพื้นฐานของ Pokémon</p>

                            <div className="pokemon-stats-grid">
                                {statFields.map(([label, name]) => (
                                    <label key={name}>
                                        {label}
                                        <input
                                            type="number"
                                            min="0"
                                            name={`stats.${name}`}
                                            value={newPokemon.stats[name]}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* FORM ACTIONS */}
                        <div className="pokemon-form-actions">
                            <button
                                type="button"
                                className="pokemon-form-cancel"
                                disabled={saving}
                                onClick={() => setShowAddForm(false)}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="pokemon-form-save"
                                disabled={saving}
                            >
                                {saving
                                    ? "Saving..."
                                    : editingId
                                        ? "Update Pokémon"
                                        : "Save Pokémon"}
                            </button>
                        </div>

                    </form>
                </div>
            )}

            {/* PAGE HEADER */}
            <header className="admin-topbar pokemon-admin-header">
                <div>
                    <span className="pokemon-admin-eyebrow">
                        POKÉDEX CONTROL CENTER
                    </span>
                    <h1>Pokémon Management</h1>
                    <p>จัดการข้อมูล Pokémon ทั้งหมดในระบบของคุณ</p>
                </div>

                <div className="pokemon-admin-header-actions">
                    <Link to="/admin" className="pokemon-admin-back">
                        <ArrowLeft size={17} />
                        Dashboard
                    </Link>

                    <button
                        className="pokemon-admin-add"
                        onClick={() => setShowAddForm(true)}
                    >
                        + Add Pokémon
                    </button>
                </div>
            </header>

            {/* POKEMON LIST */}
            <section className="admin-section">
                <div className="admin-section-heading">
                    <div>
                        <h2>Pokémon List</h2>
                        <p>Pokémon ทั้งหมด {pokemon.length} ตัว</p>
                    </div>
                </div>

                <div className="pokemon-admin-search">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อ Pokémon..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="admin-message">
                        กำลังโหลดข้อมูล Pokémon...
                    </div>
                ) : error ? (
                    <div className="admin-error">{error}</div>
                ) : filteredPokemon.length === 0 ? (
                    <div className="admin-message">
                        ไม่พบ Pokémon ที่ค้นหา
                    </div>
                ) : (
                    <div className="pokemon-admin-grid">
                        {filteredPokemon.map((item) => (
                            <div className="pokemon-admin-card" key={item.id}>
                                <img
                                    src={item.image_url}
                                    alt={item.name}
                                    onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                    }}
                                />

                                <div className="pokemon-admin-info">
                                    <span>
                                        #{String(item.id).padStart(3, "0")}
                                    </span>
                                    <h3>{item.name}</h3>

                                    <div className="pokemon-admin-types">
                                        {(item.types || []).map((type) => (
                                            <span key={type}>{type}</span>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        className="pokemon-edit-button"
                                        onClick={() => handleEdit(item.id)}
                                    >
                                        Edit Pokémon
                                    </button>

<button
    type="button"
    className="pokemon-delete-button"
    onClick={() => handleDelete(item.id, item.name)}
>
    Delete Pokémon
</button>


                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

export default PokemonManagement;
