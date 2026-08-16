const fs = require('fs');
let content = fs.readFileSync('app/page.module.css', 'utf8');

const t1 = `.modeCard {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
}

.modeCard:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-5px);
  border-color: var(--primary);
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
}`;

const r1 = `.modeCard {
  background: rgba(33, 115, 70, 0.05);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 2rem 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--foreground);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
}

.modeCard:hover {
  background: rgba(33, 115, 70, 0.12);
  transform: translateY(-5px);
  border-color: var(--primary);
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}`;

const t2 = `.eyeBtn {
  position: absolute;
  left: 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  color: white;
  opacity: 0.7;
  display: flex;
  align-items: center;
}`;

const r2 = `.eyeBtn {
  position: absolute;
  left: 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--foreground);
  opacity: 0.7;
  display: flex;
  align-items: center;
}`;

content = content.replace(t1, r1).replace(t2, r2);
fs.writeFileSync('app/page.module.css', content, 'utf8');
console.log('Successfully updated page.module.css!');
