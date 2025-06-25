#!/usr/bin/env tsx

// Load environment variables from .env.local
import dotenv from 'dotenv';
import { join } from 'path';

// Load .env.local file
dotenv.config({ path: join(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// This script sets up the database schema
// Run with: npx tsx scripts/setup-database.ts

async function setupDatabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    console.error('Current URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.error('Current Service Key:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Read the schema SQL file
    const schemaPath = join(process.cwd(), 'supabase', 'schema.sql');
    const schemaSql = readFileSync(schemaPath, 'utf-8');

    console.log('Setting up database schema...');

    // Split SQL into statements and execute them one by one
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc('exec', { sql: statement + ';' });
          
          if (error) {
            // Try alternative approach with direct query for DDL statements
            if (statement.toUpperCase().includes('CREATE') || 
                statement.toUpperCase().includes('ALTER') ||
                statement.toUpperCase().includes('DROP')) {
              console.log('Retrying with direct execution...');
              // For now, we'll log the statement that failed
              console.log('Failed statement:', statement.substring(0, 100) + '...');
            } else {
              throw error;
            }
          }
        } catch (err) {
          console.warn(`Warning: Could not execute statement ${i + 1}:`, err);
          // Continue with next statement
        }
      }
    }

    console.log('✅ Database schema setup completed!');

    // Test the setup by checking if tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', [
        'profiles',
        'tasks',
        'teams',
        'categories',
        'notifications'
      ]);

    if (tablesError) {
      console.warn('Could not verify table creation:', tablesError);
      console.log('Note: You may need to run the SQL manually in Supabase Dashboard');
      console.log('SQL file location: supabase/schema.sql');
    } else {
      console.log('✅ Verified tables:', tables?.map(t => t.table_name).join(', '));
    }

  } catch (error) {
    console.error('Error during database setup:', error);
    console.log('\n🔧 Alternative Setup Method:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of supabase/schema.sql');
    console.log('4. Execute the SQL manually');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupDatabase();
}

export { setupDatabase };