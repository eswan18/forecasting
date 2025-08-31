"use server";

import { db } from '@/lib/database';
import { Login, NewLogin, LoginUpdate } from '@/types/db_types';
import { getUserFromCookies } from '@/lib/get-user';
import { logger } from '@/lib/logger';

export async function getLoginByUsername(username: string): Promise<Login | undefined> {
  logger.debug('Getting login by username', { 
    username 
  });
  
  const startTime = Date.now();
  try {
    const login = await db
      .selectFrom('logins')
      .selectAll()
      .where('username', '=', username)
      .executeTakeFirst();
    
    const duration = Date.now() - startTime;
    if (login) {
      logger.info('Login retrieved successfully', { 
        operation: 'getLoginByUsername',
        table: 'logins',
        loginId: login.id,
        duration
      });
    } else {
      logger.warn('Login not found', { 
        operation: 'getLoginByUsername',
        table: 'logins',
        username,
        duration
      });
    }
    
    return login;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Failed to get login by username', error as Error, { 
      operation: 'getLoginByUsername',
      table: 'logins',
      username,
      duration
    });
    throw error;
  }
}

export async function createLogin({ login }: { login: NewLogin }): Promise<number> {
  logger.debug('Creating login', { 
    username: login.username 
  });
  
  const startTime = Date.now();
  try {
    const { id } = await db
      .insertInto('logins')
      .values(login)
      .returning('id')
      .executeTakeFirstOrThrow();
    
    const duration = Date.now() - startTime;
    logger.info('Login created successfully', { 
      operation: 'createLogin',
      table: 'logins',
      loginId: id,
      username: login.username,
      duration
    });
    
    return id;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Failed to create login', error as Error, { 
      operation: 'createLogin',
      table: 'logins',
      username: login.username,
      duration
    });
    throw error;
  }
}

type UpdateLoginResponseSuccess = {
  success: true;
}
type UpdateLoginResponseError = {
  success: false;
  error: string;
}
export type UpdateLoginResponse = UpdateLoginResponseSuccess | UpdateLoginResponseError;

export async function updateLogin({ id, login }: { id: number, login: LoginUpdate }): Promise<UpdateLoginResponse> {
  const currentUser = await getUserFromCookies();
  logger.debug('Updating login', { 
    loginId: id, 
    updateFields: Object.keys(login),
    currentUserId: currentUser?.id 
  });
  
  const startTime = Date.now();
  try {
    // Check that the user is who they say they are.
    if (!currentUser || currentUser.login_id !== id) {
      logger.warn('Unauthorized attempt to update login', { 
        loginId: id, 
        currentUserId: currentUser?.id 
      });
      return { success: false, error: 'Unauthorized' };
    }
    
    // Users can only change their username with this function.
    // If they try to change anything else, throw an error.
    if (Object.keys(login).some(key => !['username'].includes(key))) {
      logger.warn('Attempted to update unauthorized login fields', { 
        loginId: id, 
        attemptedFields: Object.keys(login),
        currentUserId: currentUser?.id 
      });
      return { success: false, error: 'Not authorized to update login fields other than "username"' };
    }
    
    await db
      .updateTable('logins')
      .set(login)
      .where('id', '=', id)
      .execute();
    
    const duration = Date.now() - startTime;
    logger.info('Login updated successfully', { 
      operation: 'updateLogin',
      table: 'logins',
      loginId: id,
      updateFields: Object.keys(login),
      duration
    });
    
    return { success: true };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Failed to update login', error as Error, { 
      operation: 'updateLogin',
      table: 'logins',
      loginId: id,
      duration
    });
    throw error;
  }
}

