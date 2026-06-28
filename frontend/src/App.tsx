// frontend App.tsx
import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';

//all tenant properties, displayed in a grid layout
interface Property {
  id: number;
  address: string;
  tenant_name: string;
  rent_received: number; 
  notes: string;
}

function App() {
  const [properties, setProperties] = useState<Property[]>([]);
  
  // State for the "Add New Property" form
  const [newProperty, setNewProperty] = useState({
    address: '',
    tenant_name: '',
    notes: ''
  });

  // Fetch properties on load
  useEffect(() => {
    fetch('http://localhost:3001/api/properties')
      .then(res => res.json())
      .then((data: Property[]) => setProperties(data))
      .catch(err => console.error("Failed to fetch properties:", err));
  }, []);

  // ADD Property
  const handleAddProperty = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent page reload
    if (!newProperty.address || !newProperty.tenant_name) return;

    try {
      const response = await fetch('http://localhost:3001/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProperty)
      });
      const data = await response.json();

      // Add the new property to the UI immediately
      setProperties([...properties, { 
        ...newProperty, 
        id: data.id, 
        rent_received: 0 
      }]);

      // Clear the form
      setNewProperty({ address: '', tenant_name: '', notes: '' });
    } catch (err) {
      console.error("Failed to add property:", err);
    }
  };

  // DELETE Property
  const handleDeleteProperty = async (id: number) => {
    // Confirm before deleting
    if (!window.confirm("Are you sure you want to delete this property?")) return;

    try {
      await fetch(`http://localhost:3001/api/properties/${id}`, {
        method: 'DELETE'
      });
      // Remove from UI
      setProperties(properties.filter(p => p.id !== id));
    } catch (err) {
      console.error("Failed to delete property:", err);
    }
  };

  // UPDATE Property (Shared function)
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

  const handleRentToggle = (property: Property) => {
    const updatedRentStatus = property.rent_received ? 0 : 1;
    setProperties(properties.map(p => 
      p.id === property.id ? { ...p, rent_received: updatedRentStatus } : p
    ));
    updateProperty(property.id, { rent_received: updatedRentStatus, notes: property.notes });
  };

  const handleNoteChange = (id: number, newNote: string) => {
    setProperties(properties.map(p => 
      p.id === id ? { ...p, notes: newNote } : p
    ));
  };

  const saveNote = (property: Property) => {
    updateProperty(property.id, { rent_received: property.rent_received, notes: property.notes });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Property Dashboard</h1>
      
      {/* ADD NEW PROPERTY FORM */}
      <div style={{ backgroundColor: '#f0f7ff', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h3 style={{ marginTop: 0 }}>Add New Property</h3>
        <form onSubmit={handleAddProperty} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Property Address" 
            value={newProperty.address}
            onChange={e => setNewProperty({...newProperty, address: e.target.value})}
            style={{ padding: '8px', flex: '1', minWidth: '200px' }}
            required
          />
          <input 
            type="text" 
            placeholder="Tenant Name" 
            value={newProperty.tenant_name}
            onChange={e => setNewProperty({...newProperty, tenant_name: e.target.value})}
            style={{ padding: '8px', flex: '1', minWidth: '150px' }}
            required
          />
          <input 
            type="text" 
            placeholder="Notes (Optional)" 
            value={newProperty.notes}
            onChange={e => setNewProperty({...newProperty, notes: e.target.value})}
            style={{ padding: '8px', flex: '2', minWidth: '200px' }}
          />
          <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Add Property
          </button>
        </form>
      </div>

      {/* PROPERTIES GRID */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: '20px' 
      }}>
        {properties.map(property => (
          <div key={property.id} style={{ 
            border: '1px solid #e0e0e0', 
            padding: '20px', 
            borderRadius: '12px', 
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h2 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '1.3em' }}>{property.address}</h2>
              <button 
                onClick={() => handleDeleteProperty(property.id)}
                style={{ backgroundColor: '#ffebee', color: '#d32f2f', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9em' }}
              >
                Delete
              </button>
            </div>
            
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
              <strong>Notes:</strong>
              <textarea 
                value={property.notes || ''}
                onChange={(e) => handleNoteChange(property.id, e.target.value)}
                onBlur={() => saveNote(property)}
                placeholder="Add notes here... (Saves automatically)"
                style={{ 
                  width: '100%', 
                  flexGrow: 1,
                  minHeight: '80px', 
                  padding: '12px', 
                  borderRadius: '6px',
                  border: '1px solid #ccc',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        ))}
      </div>
      
      {properties.length === 0 && (
        <p style={{ textAlign: 'center', color: '#666', marginTop: '40px' }}>No properties found. Add one above!</p>
      )}
    </div>
  );
}

export default App;