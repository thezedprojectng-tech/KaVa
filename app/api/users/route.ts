import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getSupabaseAdmin() {
  if (supabaseUrl && serviceRoleKey) {
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return null;
}

function getSupabaseClient() {
  if (supabaseUrl && anonKey && supabaseUrl !== 'https://your-project.supabase.co') {
    return createClient(supabaseUrl, anonKey);
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin() || getSupabaseClient();
    if (!supabaseAdmin) {
      return NextResponse.json({ profiles: [], source: 'offline' });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const profiles = (data || []).map((p: any) => ({
      id: p.id,
      role: p.role,
      fullName: p.full_name,
      email: p.email,
      phone: p.phone,
      assignedLgas: p.assigned_lgas || [],
      assignedEas: p.assigned_eas || [],
      status: p.status || 'active',
      createdAt: p.created_at
    }));

    return NextResponse.json({ profiles, source: 'supabase' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, phone, role, password, assignedLgas, assignedEas } = body;

    if (!fullName || !email || !role) {
      return NextResponse.json(
        { error: 'Full name, email, and role are required.' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const now = new Date().toISOString();

    if (supabaseAdmin) {
      // Create Auth user server-side with service role key
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: password || `Kassep@${Math.floor(1000 + Math.random() * 9000)}`,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role
        }
      });

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }

      const userId = authData.user.id;

      // Upsert profile in profiles table
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          role,
          full_name: fullName,
          email,
          phone: phone || null,
          assigned_lgas: assignedLgas || [],
          assigned_eas: assignedEas || [],
          status: 'active',
          updated_at: now
        })
        .select()
        .single();

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 500 });
      }

      return NextResponse.json({
        user: {
          id: profileData.id,
          role: profileData.role,
          fullName: profileData.full_name,
          email: profileData.email,
          phone: profileData.phone,
          assignedLgas: profileData.assigned_lgas || [],
          assignedEas: profileData.assigned_eas || [],
          status: profileData.status || 'active',
          createdAt: profileData.created_at
        }
      });
    }

    // Offline / Local development fallback
    const localId = `usr-${role.substring(0, 3)}-${Date.now()}`;
    const newProfile = {
      id: localId,
      role,
      fullName,
      email,
      phone: phone || '',
      assignedLgas: assignedLgas || [],
      assignedEas: assignedEas || [],
      status: 'active' as const,
      createdAt: now
    };

    return NextResponse.json({ user: newProfile, source: 'local' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, fullName, phone, role, status, assignedEas, assignedLgas } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin() || getSupabaseClient();
    const now = new Date().toISOString();

    const updates: Record<string, any> = { updated_at: now };
    if (fullName !== undefined) updates.full_name = fullName;
    if (phone !== undefined) updates.phone = phone;
    if (role !== undefined) updates.role = role;
    if (status !== undefined) updates.status = status;
    if (assignedEas !== undefined) updates.assigned_eas = assignedEas;
    if (assignedLgas !== undefined) updates.assigned_lgas = assignedLgas;

    if (supabaseAdmin) {
      const { error } = await supabaseAdmin.from('profiles').update(updates).eq('id', id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, updates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

