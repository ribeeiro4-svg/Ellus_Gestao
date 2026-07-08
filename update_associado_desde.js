const xlsx = require('xlsx');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ukfgrjcflhlgeuarxtmt.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZmdyamNmbGhsZ2V1YXJ4dG10Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI4MDY4MiwiZXhwIjoyMDkxODU2NjgyfQ.1CeLLRhn1vrqzE3GlNZg4sfz2lL4AeAjctfBw69HCWc';

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function excelDateToJSDate(serial) {
    if (!serial || isNaN(serial)) return null;
    const utc_days  = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;                                        
    const date_info = new Date(utc_value * 1000);
    return date_info.toISOString().split('T')[0];
}

async function run() {
    const filePath = path.join(__dirname, 'docs', 'ZapSign_Documents_2026_07_03.xlsx');
    const workbook = xlsx.readFile(filePath);
    const signatariosSheet = workbook.Sheets['Signatarios'];
    
    const data = xlsx.utils.sheet_to_json(signatariosSheet);
    const signed = data.filter(d => d.Status === 'Assinou');
    
    const { data: associados, error } = await sb.from('associados').select('id, nome, email, data_assinatura');
    if (error) {
        console.error('Error fetching associados', error);
        return;
    }

    let updatesMap = new Map();

    for (const s of signed) {
        let assoc = associados.find(a => a.email && s.Email && a.email.toLowerCase() === s.Email.toLowerCase());
        
        if (!assoc) {
            assoc = associados.find(a => a.nome && s.Nome && a.nome.toLowerCase() === s.Nome.toLowerCase());
        }

        if (!assoc) {
            assoc = associados.find(a => a.nome && s.Nome && (a.nome.toLowerCase().includes(s.Nome.toLowerCase()) || s.Nome.toLowerCase().includes(a.nome.toLowerCase())));
        }

        if (assoc) {
            const jsDate = excelDateToJSDate(s['Data assinatura']);
            if (jsDate) {
                const existingUpdate = updatesMap.get(assoc.id);
                // Keep the oldest date
                if (!existingUpdate || new Date(jsDate) < new Date(existingUpdate.newDate)) {
                    updatesMap.set(assoc.id, { id: assoc.id, newDate: jsDate, nome: assoc.nome });
                }
            }
        }
    }

    const updates = Array.from(updatesMap.values());
    console.log(`Updates to apply: ${updates.length}`);
    
    let appliedCount = 0;
    // Update sequentially or in batches
    for (const update of updates) {
        // Skip if date is already the same
        const assoc = associados.find(a => a.id === update.id);
        if (assoc && assoc.data_assinatura === update.newDate) continue;

        const { error: updateError } = await sb.from('associados')
            .update({ data_assinatura: update.newDate })
            .eq('id', update.id);
            
        if (updateError) {
            console.error(`Error updating ${update.id}:`, updateError);
        } else {
            appliedCount++;
        }
    }

    console.log(`Successfully updated ${appliedCount} associados com a data de adesão do ZapSign.`);
}

run();
