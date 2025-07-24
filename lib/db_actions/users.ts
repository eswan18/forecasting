'use server';

import { OrderByExpression, OrderByModifiers } from 'kysely';
import { db } from '@/lib/database';
import { VUser, NewUser, UserUpdate, Database } from '@/types/db_types';
import { getUserFromCookies } from '@/lib/get-user';
import { ServerActionResult, success, error, ERROR_CODES } from '@/lib/server-action-result';

type Sort = {
  expr: OrderByExpression<Database, 'v_users', VUser>,
  modifiers?: OrderByModifiers
}

export async function getUsers({ sort }: { sort?: Sort } = {}): Promise<ServerActionResult<VUser[]>> {
  try {
    const user = await getUserFromCookies();
    if (!user) {
      return error('You must be logged in to view users', ERROR_CODES.UNAUTHORIZED);
    }
    
    let query = db.selectFrom('v_users').selectAll();
    if (sort) {
      query = query.orderBy(sort.expr, sort.modifiers);
    }
    const users = await query.execute();
    return success(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    return error('Failed to fetch users', ERROR_CODES.DATABASE_ERROR);
  }
}

export async function getUserById(id: number): Promise<ServerActionResult<VUser | undefined>> {
  try {
    const user = await getUserFromCookies();
    if (!user) {
      return error('You must be logged in to view user details', ERROR_CODES.UNAUTHORIZED);
    }
    
    const foundUser = await db
      .selectFrom('v_users')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
      
    return success(foundUser);
  } catch (err) {
    console.error('Error fetching user by id:', err);
    return error('Failed to fetch user details', ERROR_CODES.DATABASE_ERROR);
  }
}

export async function createUser({ user }: { user: NewUser }): Promise<ServerActionResult<number>> {
  try {
    const result = await db
      .insertInto('users')
      .values(user)
      .returning('id')
      .executeTakeFirst();
      
    if (!result) {
      return error('Failed to create user', ERROR_CODES.DATABASE_ERROR);
    }
    
    return success(result.id);
  } catch (err) {
    console.error('Error creating user:', err);
    if (err instanceof Error && err.message.includes('duplicate')) {
      return error('A user with this email already exists', ERROR_CODES.VALIDATION_ERROR);
    }
    return error('Failed to create user', ERROR_CODES.DATABASE_ERROR);
  }
}

export async function updateUser({ id, user }: { id: number, user: UserUpdate }): Promise<ServerActionResult<void>> {
  try {
    // Check that the user is who they say they are.
    const currentUser = await getUserFromCookies();
    if (!currentUser || currentUser.id !== id) {
      return error('You can only update your own profile', ERROR_CODES.UNAUTHORIZED);
    }
    
    // Users can only change a couple of fields: name and email.
    // If they try to change anything else, return an error.
    const allowedFields = ['name', 'email'];
    const invalidFields = Object.keys(user).filter(key => !allowedFields.includes(key));
    
    if (invalidFields.length > 0) {
      return error(
        `You cannot update the following fields: ${invalidFields.join(', ')}`, 
        ERROR_CODES.VALIDATION_ERROR
      );
    }
    
    await db
      .updateTable('users')
      .set(user)
      .where('id', '=', id)
      .execute();
      
    return success(undefined);
  } catch (err) {
    console.error('Error updating user:', err);
    if (err instanceof Error && err.message.includes('duplicate')) {
      return error('A user with this email already exists', ERROR_CODES.VALIDATION_ERROR);
    }
    return error('Failed to update user', ERROR_CODES.DATABASE_ERROR);
  }
}