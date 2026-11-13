//ไฟล์นี้ใช้แสดงปุ่มกรอง Pokémon ตามประเภท เช่น Fire, Water, Grass และ Electric
function TypeFilter({ types, selectedType, onTypeChange }) {
  return (
    <div className="type-filters">
      {types.map((type) => (
        <button
          key={type}
          className={
            selectedType === type
              ? "type-filter selected"
              : "type-filter"
          }
          onClick={() => onTypeChange(type)}
        >
          {type}
        </button>
      ))}
    </div>
  );
}

export default TypeFilter;
