'use server';

import { NewSuggestedProp } from '@/types/db_types';
import { db } from '@/lib/database';
import { getUserFromCookies } from '@/lib/get-user';
import { logger } from '@/lib/logger';

export async function getSuggestedProps() {
  const currentUser = await getUserFromCookies();
  logger.debug('Getting suggested props', { 
    currentUserId: currentUser?.id 
  });
  
  const startTime = Date.now();
  try {
    if (!currentUser?.is_admin) {
      logger.warn('Unauthorized attempt to get suggested props', { 
        currentUserId: currentUser?.id 
      });
      throw new Error('Unauthorized: only admins can view suggested props');
    }
    
    const results = await db.selectFrom('v_suggested_props').selectAll().execute();
    
    const duration = Date.now() - startTime;
    logger.info(`Retrieved ${results.length} suggested props`, { 
      operation: 'getSuggestedProps',
      table: 'v_suggested_props',
      duration
    });
    
    return results;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Failed to get suggested props', error as Error, { 
      operation: 'getSuggestedProps',
      table: 'v_suggested_props',
      duration
    });
    throw error;
  }
}

export async function createSuggestedProp({ prop }: { prop: NewSuggestedProp }) {
  const currentUser = await getUserFromCookies();
  logger.debug('Creating suggested prop', { 
    suggesterUserId: prop.suggester_user_id,
    currentUserId: currentUser?.id 
  });
  
  const startTime = Date.now();
  try {
    if (!currentUser) {
      logger.warn('Unauthorized attempt to create suggested prop', { 
        suggesterUserId: prop.suggester_user_id 
      });
      throw new Error('Unauthorized');
    }
    
    // Make sure the user is suggesting a prop with their own user ID.
    if (prop.suggester_user_id !== currentUser.id) {
      logger.warn('User attempted to suggest prop for different user', { 
        suggesterUserId: prop.suggester_user_id,
        currentUserId: currentUser.id 
      });
      throw new Error('Unauthorized');
    }
    
    const { id } = await db
      .insertInto('suggested_props')
      .values(prop)
      .returning('id')
      .executeTakeFirstOrThrow();
    
    const duration = Date.now() - startTime;
    logger.info('Suggested prop created successfully', { 
      operation: 'createSuggestedProp',
      table: 'suggested_props',
      suggestedPropId: id,
      suggesterUserId: prop.suggester_user_id,
      duration
    });
    
    return id;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Failed to create suggested prop', error as Error, { 
      operation: 'createSuggestedProp',
      table: 'suggested_props',
      suggesterUserId: prop.suggester_user_id,
      duration
    });
    throw error;
  }
}