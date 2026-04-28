export type UserRole = 'coach' | 'client';

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  photoURL?: string;
  plan?: string;
  coachId?: string;
  phone?: string;
  createdAt?: string;
}

export interface Client extends AppUser {
  id?: string;
  color?: string;
  goal?: string;
  age?: number;
  height?: number;
  weight?: number;
  goalWeight?: number;
  fat?: number;
  notes?: string;
  paymentStatus?: 'paid' | 'pending' | 'overdue';
  paymentAmount?: number;
  active?: boolean;
}

export interface Measurement {
  goalWeight?: number;
  id?: string;
  date: string;
  weight?: number;
  bodyFat?: number;
  lbm?: number;
  visceral?: number;
  bmi?: number;
  tbw?: number;
  waist?: number;
  hips?: number;
  chest?: number;
  arm?: number;
  thigh?: number;
  calf?: number;
  bmr?: number;
  tdee?: number;
  notes?: string;
  createdAt?: any;
}

export interface Skinfold {
  id?: string;
  date: string;
  chest?: number;
  abdomen?: number;
  thigh?: number;
  triceps?: number;
  subscapular?: number;
  fatPercent?: number;
  createdAt?: any;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment?: string;
  description?: string;
  videoUrl?: string;
  sets?: string;
  reps?: string;
  weight?: string;
  rest?: string;
  notes?: string;
}

export interface WorkoutProtocol {
  id: string;
  name: string;
  description?: string;
  exercises: WorkoutExercise[];
  createdAt?: any;
  coachId?: string;
}

export interface WorkoutExercise {
  exerciseId: string;
  exerciseName: string;
  sets: string;
  reps: string;
  weight: string;
  rest: string;
  notes?: string;
  videoUrl?: string;
}

export interface MealPlan {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: Meal[];
  createdAt?: any;
}

export interface Meal {
  name: string;
  time: string;
  foods: FoodItem[];
}

export interface FoodItem {
  name: string;
  amount: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Payment {
  id?: string;
  clientId: string;
  clientName: string;
  plan: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  paidAt?: any;
  notes?: string;
  createdAt?: any;
}

export interface Alert {
  id?: string;
  type: 'payment' | 'measurement' | 'workout' | 'checkin' | 'custom';
  clientName: string;
  clientId?: string;
  date: string;
  time: string;
  message: string;
  done: boolean;
  createdAt?: any;
}

export interface ProgressPhoto {
  id?: string;
  clientId: string;
  url: string;
  date: string;
  weight?: number;
  notes?: string;
  createdAt?: any;
}

export type Screen =
  | 'login'
  | 'dashboard'
  | 'clients'
  | 'client-profile'
  | 'nutrition'
  | 'workout'
  | 'measurements'
  | 'calendar'
  | 'payments'
  | 'alerts'
  | 'reports'
  | 'exercises'
  | 'settings'
  | 'community';
