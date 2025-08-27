# Database Migration Guide

This directory contains SQL migration scripts to update your Supabase database from the old entry-based system to the new user-based multi-league system.

## Migration Order

**IMPORTANT**: Run these migrations in the exact order shown below:

### 1. Create New Tables
```sql
-- Run in Supabase SQL Editor:
\i migrations/001_create_users_table.sql
\i migrations/002_create_league_managers_table.sql
```

### 2. Update Existing Table Schema
```sql
\i migrations/003_update_leagues_table.sql
\i migrations/004_update_invites_table.sql
```

### 3. Migrate Data
```sql
\i migrations/005_migrate_existing_data.sql
\i migrations/006_update_entries_table.sql
\i migrations/007_update_sessions_table.sql
\i migrations/008_update_invites_references.sql
```

## What Each Migration Does

1. **001_create_users_table.sql**: Creates the global users table with roles
2. **002_create_league_managers_table.sql**: Creates league management permissions
3. **003_update_leagues_table.sql**: Adds created_by_user_id and ensures league_code is required
4. **004_update_invites_table.sql**: Updates invite system for new architecture
5. **005_migrate_existing_data.sql**: Migrates user data from entries to users table, sets Taylor as super_admin
6. **006_update_entries_table.sql**: Updates entries to reference users, removes duplicate user fields
7. **007_update_sessions_table.sql**: Updates sessions to reference users instead of entries
8. **008_update_invites_references.sql**: Updates invite references to use user IDs

## After Migration

1. **Verify Data**: Check that all users were migrated correctly
2. **Test Login**: Try logging in with the new authentication system
3. **Create Invite Codes**: Test the new invite system
4. **Assign League Managers**: Use the new management system

## Rollback Plan

If something goes wrong, you can restore from your Supabase backup or contact support. Make sure to backup your database before running these migrations!

## New Features Available After Migration

- Global user accounts (one account, multiple leagues)
- League management permissions
- Invite codes with expiration and usage limits
- Role-based access control (super_admin, league_manager, player)
- Multi-league user support