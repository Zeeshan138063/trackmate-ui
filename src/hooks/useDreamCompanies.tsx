import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import {
  DreamCompany,
  DreamCompanyWithDetails,
  CreateDreamCompanyData,
  UpdateDreamCompanyData,
  CompanyJobOpening,
  CompanyResearch,
  CompanyActivity,
  CompanyFilters,
  CompanySortOption,
  CompanyAnalytics,
  CompanyScore
} from '@/types/dreamCompany';

export const useDreamCompanies = () => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<DreamCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all companies for the current user
  const fetchCompanies = useCallback(async (filters?: CompanyFilters, sort?: CompanySortOption) => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from('dream_companies')
        .select('*')
        .eq('user_id', user.id);

      // Apply filters
      if (filters) {
        if (filters.status && filters.status.length > 0) {
          query = query.in('status', filters.status);
        }
        if (filters.priority && filters.priority.length > 0) {
          query = query.in('priority', filters.priority);
        }
        if (filters.remote_policy && filters.remote_policy.length > 0) {
          query = query.in('remote_policy', filters.remote_policy);
        }
        if (filters.python_usage && filters.python_usage.length > 0) {
          query = query.in('python_usage', filters.python_usage);
        }
        if (filters.company_size && filters.company_size.length > 0) {
          query = query.in('company_size', filters.company_size);
        }
        if (filters.hiring_difficulty && filters.hiring_difficulty.length > 0) {
          query = query.in('hiring_difficulty', filters.hiring_difficulty);
        }
        if (filters.salary_min !== undefined) {
          query = query.gte('salary_min', filters.salary_min);
        }
        if (filters.salary_max !== undefined) {
          query = query.lte('salary_max', filters.salary_max);
        }
        if (filters.is_actively_hiring !== undefined) {
          query = query.eq('is_actively_hiring', filters.is_actively_hiring);
        }
        if (filters.search_query) {
          query = query.or(`name.ilike.%${filters.search_query}%,industry.ilike.%${filters.search_query}%,notes.ilike.%${filters.search_query}%`);
        }
      }

      // Apply sorting
      if (sort) {
        query = query.order(sort.field, { ascending: sort.direction === 'asc' });
      } else {
        query = query.order('updated_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      setCompanies(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching dream companies:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch companies');
      toast({
        title: "Error",
        description: "Failed to fetch dream companies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create a new company
  const createCompany = async (data: CreateDreamCompanyData): Promise<DreamCompany | null> => {
    if (!user) return null;

    try {
      const companyData = {
        user_id: user.id,
        name: data.name,
        logo_url: data.logo_url,
        website_url: data.website_url,
        industry: data.industry,
        company_size: data.company_size,
        location: data.location,
        founded_year: data.founded_year,
        employee_count: data.employee_count,
        remote_policy: data.remote_policy || 'hybrid',
        flexibility_score: data.flexibility_score || 5,
        timezone_flexibility: data.timezone_flexibility,
        python_usage: data.python_usage || 'secondary',
        tech_stack: data.tech_stack,
        python_frameworks: data.python_frameworks,
        salary_min: data.salary_min,
        salary_max: data.salary_max,
        salary_currency: data.salary_currency || 'USD',
        salary_level: data.salary_level,
        benefits: {
          healthInsurance: false,
          dentalVision: false,
          retirement401k: false,
          stockOptions: false,
          unlimitedPTO: false,
          learningBudget: 0,
          homeOfficeStipend: 0,
          relocationAssistance: false,
          visaSponsorship: false,
          ...data.benefits
        },
        work_life_balance: data.work_life_balance || 5,
        learning_opportunities: data.learning_opportunities || 5,
        career_growth: data.career_growth || 5,
        diversity_score: data.diversity_score || 5,
        hiring_difficulty: data.hiring_difficulty || 'moderate',
        average_interview_process: data.average_interview_process,
        response_rate: data.response_rate,
        status: data.status || 'researching',
        priority: data.priority || 'medium',
        notes: data.notes,
        glassdoor_rating: data.glassdoor_rating,
        glassdoor_reviews_count: data.glassdoor_reviews_count,
        recent_funding_amount: data.recent_funding_amount,
        recent_funding_date: data.recent_funding_date,
        is_actively_hiring: data.is_actively_hiring || false,
        target_application_date: data.target_application_date,
      };

      const { data: newCompany, error } = await supabase
        .from('dream_companies')
        .insert([companyData])
        .select()
        .single();

      if (error) throw error;

      setCompanies(prev => [newCompany, ...prev]);
      
      toast({
        title: "Success",
        description: `${data.name} has been added to your dream companies!`,
      });

      return newCompany;
    } catch (err) {
      console.error('Error creating company:', err);
      toast({
        title: "Error",
        description: "Failed to create company",
        variant: "destructive",
      });
      return null;
    }
  };

  // Update a company
  const updateCompany = async (data: UpdateDreamCompanyData): Promise<boolean> => {
    if (!user) return false;

    try {
      const { id, ...updateData } = data;
      
      const { error } = await supabase
        .from('dream_companies')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setCompanies(prev => 
        prev.map(company => 
          company.id === id ? { ...company, ...updateData } : company
        )
      );

      toast({
        title: "Success",
        description: "Company updated successfully!",
      });

      return true;
    } catch (err) {
      console.error('Error updating company:', err);
      toast({
        title: "Error",
        description: "Failed to update company",
        variant: "destructive",
      });
      return false;
    }
  };

  // Delete a company
  const deleteCompany = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('dream_companies')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setCompanies(prev => prev.filter(company => company.id !== id));

      toast({
        title: "Success",
        description: "Company deleted successfully!",
      });

      return true;
    } catch (err) {
      console.error('Error deleting company:', err);
      toast({
        title: "Error",
        description: "Failed to delete company",
        variant: "destructive",
      });
      return false;
    }
  };

  // Get company with full details (including related data)
  const getCompanyWithDetails = async (companyId: string): Promise<DreamCompanyWithDetails | null> => {
    if (!user) return null;

    try {
      // Fetch company
      const { data: company, error: companyError } = await supabase
        .from('dream_companies')
        .select('*')
        .eq('id', companyId)
        .eq('user_id', user.id)
        .single();

      if (companyError) throw companyError;

      // Fetch related data in parallel
      const [
        { data: contacts },
        { data: jobOpenings },
        { data: research },
        { data: activities }
      ] = await Promise.all([
        supabase
          .from('contacts')
          .select('*')
          .eq('dream_company_id', companyId)
          .eq('user_id', user.id),
        supabase
          .from('company_job_openings')
          .select('*')
          .eq('company_id', companyId)
          .eq('user_id', user.id),
        supabase
          .from('company_research')
          .select('*')
          .eq('company_id', companyId)
          .eq('user_id', user.id)
          .order('research_date', { ascending: false }),
        supabase
          .from('company_activities')
          .select('*')
          .eq('company_id', companyId)
          .eq('user_id', user.id)
          .order('activity_date', { ascending: false })
      ]);

      const companyWithDetails: DreamCompanyWithDetails = {
        ...company,
        contacts: contacts || [],
        job_openings: jobOpenings || [],
        research: research || [],
        activities: activities || [],
        open_positions_count: jobOpenings?.filter(job => !job.is_applied).length || 0,
        recent_activity_count: activities?.filter(activity => {
          const activityDate = new Date(activity.activity_date);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return activityDate >= thirtyDaysAgo;
        }).length || 0
      };

      return companyWithDetails;
    } catch (err) {
      console.error('Error fetching company details:', err);
      toast({
        title: "Error",
        description: "Failed to fetch company details",
        variant: "destructive",
      });
      return null;
    }
  };

  // Get company analytics
  const getAnalytics = async (): Promise<CompanyAnalytics | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('dream_companies')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const companies = data || [];

      // Calculate analytics
      const analytics: CompanyAnalytics = {
        total_companies: companies.length,
        by_status: companies.reduce((acc, company) => {
          acc[company.status] = (acc[company.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) as Record<any, number>,
        by_priority: companies.reduce((acc, company) => {
          acc[company.priority] = (acc[company.priority] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) as Record<any, number>,
        by_remote_policy: companies.reduce((acc, company) => {
          acc[company.remote_policy] = (acc[company.remote_policy] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) as Record<any, number>,
        by_python_usage: companies.reduce((acc, company) => {
          acc[company.python_usage] = (acc[company.python_usage] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) as Record<any, number>,
        average_salary_range: {
          min: companies.filter(c => c.salary_min).reduce((sum, c) => sum + (c.salary_min || 0), 0) / companies.filter(c => c.salary_min).length || 0,
          max: companies.filter(c => c.salary_max).reduce((sum, c) => sum + (c.salary_max || 0), 0) / companies.filter(c => c.salary_max).length || 0,
          currency: 'USD'
        },
        top_tech_stacks: (() => {
          const techCount: Record<string, number> = {};
          companies.forEach(company => {
            company.tech_stack?.forEach(tech => {
              techCount[tech] = (techCount[tech] || 0) + 1;
            });
          });
          return Object.entries(techCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([technology, count]) => ({ technology, count }));
        })(),
        response_rate_stats: (() => {
          const companiesWithResponseRate = companies.filter(c => c.response_rate !== null && c.response_rate !== undefined);
          const rates = companiesWithResponseRate.map(c => c.response_rate!);
          return {
            average: rates.reduce((sum, rate) => sum + rate, 0) / rates.length || 0,
            median: rates.sort()[Math.floor(rates.length / 2)] || 0,
            companies_with_data: companiesWithResponseRate.length
          };
        })()
      };

      return analytics;
    } catch (err) {
      console.error('Error fetching analytics:', err);
      return null;
    }
  };

  // Calculate company scores for ranking
  const calculateCompanyScores = async (): Promise<CompanyScore[]> => {
    if (!user || companies.length === 0) return [];

    try {
      const scores: CompanyScore[] = companies.map(company => {
        // Compensation score (0-100)
        const compensationScore = (() => {
          if (!company.salary_max) return 50;
          const maxSalary = Math.max(...companies.filter(c => c.salary_max).map(c => c.salary_max!));
          return (company.salary_max / maxSalary) * 100;
        })();

        // Culture score (average of culture metrics)
        const cultureScore = (
          (company.work_life_balance * 10) +
          (company.learning_opportunities * 10) +
          (company.career_growth * 10) +
          (company.diversity_score * 10)
        ) / 4;

        // Remote friendliness score
        const remoteFriendlinessScore = (() => {
          const policyScore = {
            'fully-remote': 100,
            'remote-first': 90,
            'hybrid': 70,
            'office-required': 30
          }[company.remote_policy];
          const flexibilityScore = company.flexibility_score * 10;
          return (policyScore + flexibilityScore) / 2;
        })();

        // Python opportunities score
        const pythonOpportunitiesScore = (() => {
          const usageScore = {
            'primary': 100,
            'secondary': 70,
            'occasional': 40
          }[company.python_usage];
          const frameworkBonus = (company.python_frameworks?.length || 0) * 5;
          return Math.min(100, usageScore + frameworkBonus);
        })();

        // Career growth score (already 1-10, convert to 0-100)
        const careerGrowthScore = company.career_growth * 10;

        // Application feasibility score (inverse of hiring difficulty)
        const applicationFeasibilityScore = (() => {
          const difficultyScore = {
            'easy': 100,
            'moderate': 75,
            'hard': 50,
            'extremely-hard': 25
          }[company.hiring_difficulty];
          const responseBonus = (company.response_rate || 50) * 0.5;
          return Math.min(100, difficultyScore + responseBonus);
        })();

        // Calculate overall score (weighted average)
        const overallScore = (
          compensationScore * 0.25 +
          cultureScore * 0.20 +
          remoteFriendlinessScore * 0.20 +
          pythonOpportunitiesScore * 0.15 +
          careerGrowthScore * 0.10 +
          applicationFeasibilityScore * 0.10
        );

        return {
          company_id: company.id,
          overall_score: Math.round(overallScore),
          category_scores: {
            compensation: Math.round(compensationScore),
            culture: Math.round(cultureScore),
            remote_friendliness: Math.round(remoteFriendlinessScore),
            python_opportunities: Math.round(pythonOpportunitiesScore),
            career_growth: Math.round(careerGrowthScore),
            application_feasibility: Math.round(applicationFeasibilityScore)
          },
          ranking: 0 // Will be set after sorting
        };
      });

      // Sort by overall score and assign rankings
      scores.sort((a, b) => b.overall_score - a.overall_score);
      scores.forEach((score, index) => {
        score.ranking = index + 1;
      });

      return scores;
    } catch (err) {
      console.error('Error calculating company scores:', err);
      return [];
    }
  };

  // Bulk update company statuses
  const bulkUpdateStatus = async (companyIds: string[], status: any): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('dream_companies')
        .update({ status })
        .in('id', companyIds)
        .eq('user_id', user.id);

      if (error) throw error;

      setCompanies(prev => 
        prev.map(company => 
          companyIds.includes(company.id) ? { ...company, status } : company
        )
      );

      toast({
        title: "Success",
        description: `Updated ${companyIds.length} companies to ${status}`,
      });

      return true;
    } catch (err) {
      console.error('Error bulk updating companies:', err);
      toast({
        title: "Error",
        description: "Failed to update companies",
        variant: "destructive",
      });
      return false;
    }
  };

  // Initialize data on mount
  useEffect(() => {
    if (user) {
      fetchCompanies();
    }
  }, [user?.id]); // Only depend on user.id to prevent unnecessary refetches

  // Manual refetch function
  const refetch = useCallback(() => {
    if (user) {
      fetchCompanies();
    }
  }, [user, fetchCompanies]);

  return {
    companies,
    loading,
    error,
    fetchCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
    getCompanyWithDetails,
    getAnalytics,
    calculateCompanyScores,
    bulkUpdateStatus,
    refetch,
  };
};



// Hook for managing company job openings
export const useCompanyJobs = (companyId?: string) => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<CompanyJobOpening[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    if (!user || !companyId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('company_job_openings')
        .select('*')
        .eq('company_id', companyId)
        .eq('user_id', user.id)
        .order('date_discovered', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const createJob = async (jobData: Omit<CompanyJobOpening, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    if (!user || !companyId) return false;

    try {
      const { data, error } = await supabase
        .from('company_job_openings')
        .insert([{ ...jobData, company_id: companyId, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;

      setJobs(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Job opening added successfully!",
      });
      return true;
    } catch (err) {
      console.error('Error creating job:', err);
      toast({
        title: "Error",
        description: "Failed to create job opening",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    if (user && companyId) {
      fetchJobs();
    }
  }, [user?.id, companyId]);

  return {
    jobs,
    loading,
    fetchJobs,
    createJob,
  };
};
