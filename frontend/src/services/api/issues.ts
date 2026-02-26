import { supabase } from '../../utils/supabase/client';

export interface Issue {
  id: number;
  player_id: number | null;
  player_team: string | null;
  team_context: 'home' | 'away';
  away_team: string | null;
  description: string;
  created_at: string;
}

export interface IssueComment {
  id: number;
  issue_id: number | null;
  comment: string | null;
  created_at: string;
}

export const issuesApi = {
  createIssue: async (data: Omit<Issue, 'id' | 'created_at'>): Promise<Issue> => {
    const { data: result, error } = await supabase
      .from('issues')
      .insert([data])
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!result) throw new Error('Failed to submit issue');
    return result;
  },

  getAllIssues: async (): Promise<Issue[]> => {
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  getIssueComments: async (issueId: number): Promise<IssueComment[]> => {
    const { data, error } = await supabase
      .from('issue_comments')
      .select('*')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },

  addIssueComment: async (issueId: number, comment: string): Promise<IssueComment> => {
    const { data: result, error } = await supabase
      .from('issue_comments')
      .insert([{ issue_id: issueId, comment }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!result) throw new Error('Failed to save comment');
    return result;
  },
};
