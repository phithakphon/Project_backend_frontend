//รับคำค้นหาจาก Home แสดงข้อความที่กำลังค้นหา ส่งค่าที่ผู้ใช้พิมพ์กลับไปให้ Home ผ่าน onSearchChange
import { Search } from "lucide-react";

function PokemonSearch({ search, onSearchChange }) {
  return (
    <div className="search-box">
      <Search size={19} />

      <input
        type="text"
        placeholder="Search Pokémon..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
}

export default PokemonSearch;
