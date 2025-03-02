import type { QueryFunction } from '@tanstack/query-core';

import { createQueryKeys } from './create-query-keys';
import { mergeQueryKeys } from './merge-query-keys';
import type { inferQueryKeyStore } from './utility-types';
import { createMutationKeys } from './create-mutation-keys';

describe('mergeQueryKeys', () => {
  interface Filters {
    preview: boolean;
    status: 'completed' | 'in-progress';
  }

  const performSetup = () => {
    const usersKeys = createQueryKeys('users', {
      me: null,
      detail: (userId: string) => ({
        queryKey: [userId],
        queryFn: () => Promise.resolve({ id: userId }),
        contextQueries: {
          settings: null,
        },
      }),
    });

    const todosKeys = createQueryKeys('todos', {
      detail: (todoId: string) => [todoId],
      list: (filters: Filters) => [{ filters }],
      search: (query: string, limit: number) => [query, limit],
    });

    const todosMutationKeys = createMutationKeys('todos', {
      remove: (todoId: string) => [todoId],
    });

    return { usersKeys, todosKeys, todosMutationKeys };
  };

  it('merges the keys into a single store object using the "_def" values as the properties', () => {
    const { usersKeys, todosKeys, todosMutationKeys } = performSetup();

    const store = mergeQueryKeys(usersKeys, todosKeys, todosMutationKeys);

    expect(store).toHaveProperty('users');
    expect(store).toHaveProperty('todos');

    expect(store).toEqual({
      users: usersKeys,
      todos: { ...todosKeys, ...todosMutationKeys },
    });

    expect(store).toHaveType<{
      users: {
        _def: readonly ['users'];
        me: {
          queryKey: readonly ['users', 'me'];
        };
        detail: {
          _def: readonly ['users', 'detail'];
        } & ((userId: string) => {
          queryKey: readonly ['users', 'detail', string];
          queryFn: QueryFunction<{ id: string }, readonly ['users', 'detail', string]>;
          _ctx: {
            settings: {
              queryKey: readonly ['users', 'detail', string, 'settings'];
            };
          };
        });
      };
      todos: {
        _def: readonly ['todos'];
        detail: {
          _def: readonly ['todos', 'detail'];
        } & ((todoId: string) => {
          queryKey: readonly ['todos', 'detail', string];
        });
        list: {
          _def: readonly ['todos', 'list'];
        } & ((filters: Filters) => {
          queryKey: readonly ['todos', 'list', { filters: Filters }];
        });
        search: {
          _def: readonly ['todos', 'search'];
        } & ((
          query: string,
          limit: number,
        ) => {
          queryKey: readonly ['todos', 'search', string, number];
        });
        remove: {
          _def: readonly ['todos', 'remove'];
        } & ((todoId: string) => {
          mutationKey: readonly ['todos', 'remove', string];
        });
      };
    }>();

    expect({} as inferQueryKeyStore<typeof store>).toHaveStrictType<{
      users: {
        _def: readonly ['users'];
        me: {
          queryKey: readonly ['users', 'me'];
        };
        detail: {
          _def: readonly ['users', 'detail'];
          _ctx: {
            settings: {
              queryKey: readonly ['users', 'detail', string, 'settings'];
            };
          };
          queryKey: readonly ['users', 'detail', string];
        };
      };
      todos: {
        _def: readonly ['todos'];
        detail: {
          _def: readonly ['todos', 'detail'];
          queryKey: readonly ['todos', 'detail', string];
        };
        list: {
          _def: readonly ['todos', 'list'];
          queryKey: readonly ['todos', 'list', { filters: Filters }];
        };
        search: {
          _def: readonly ['todos', 'search'];
          queryKey: readonly ['todos', 'search', string, number];
        };
        remove: {
          _def: readonly ['todos', 'remove'];
          mutationKey: readonly ['todos', 'remove', string];
        };
      };
    }>();
  });
});
