// frontend/src/App.tsx
import { useState, useEffect } from 'react';

// Define the shape of our property data to keep TypeScript happy
interface Property {
  id: number;
  address: string;
  tenant_name: string;
  rent_received: number; // 0 or 1 from SQLite
  notes: string;
}

function App() {
  const [properties, setProperties] = useState<Property[]>([]);

  // Fetch properties on initial load
  useEffect(() => {
    fetch('http://localhost:3001/api/properties')
      .then(res => res.json())
      .then((data: Property[]) => setProperties(data))
      .catch(err => console.error("Failed to fetch properties:", err));
  }, []);

  // Centralized function to update the database
  const updateProperty = async (id: number, updatedFields: Partial<Property>) => {
    try {
      await fetch(`http://localhost:3001/api/properties/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
    } catch (err) {
      console.error("Failed to update property:", err);
    }
  };

  // Toggle rent checkbox
  const handleRentToggle = (property: Property) => {
    const updatedRentStatus = property.rent_received ? 0 : 1;
    
    // Optimistic UI update (feels instantly responsive)
    setProperties(properties.map(p => 
      p.id === property.id ? { ...p, rent_received: updatedRentStatus } : p
    ));

    // Persist to backend
    updateProperty(property.id, { 
      rent_received: updatedRentStatus, 
      notes: property.notes 
    });
  };

  // Handle Note Changes (updates React state as you type)
  const handleNoteChange = (id: number, newNote: string) => {
    setProperties(properties.map(p => 
      p.id === id ? { ...p, notes: newNote } : p
    ));
  };

  // Save Note to Backend (triggers when you click outside the text box)
  const saveNote = (property: Property) => {
    updateProperty(property.id, { 
      rent_received: property.rent_received, 
      notes: property.notes 
    });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Property Dashboard</h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
        {properties.map(property => (
          <div key={property.id} style={{ 
            border: '1px solid #e0e0e0', 
            padding: '20px', 
            borderRadius: '12px', 
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>{property.address}</h2>
            <p style={{ margin: '5px 0', fontSize: '1.1em' }}><strong>Tenant:</strong> {property.tenant_name}</p>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '15px 0', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={Boolean(property.rent_received)} 
                onChange={() => handleRentToggle(property)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <strong style={{ color: property.rent_received ? '#2e7d32' : '#d32f2f' }}>
                {property.rent_received ? 'Rent Received' : 'Rent Pending'}
              </strong>
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <strong>Notes:</strong>
              <textarea 
                value={property.notes || ''}
                onChange={(e) => handleNoteChange(property.id, e.target.value)}
                onBlur={() => saveNote(property)}
                placeholder="Add notes here... (Saves automatically when you click away)"
                style={{ 
                  width: '100%', 
                  minHeight: '80px', 
                  padding: '12px', 
                  borderRadius: '6px',
                  border: '1px solid #ccc',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;