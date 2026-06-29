import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  limit, 
  writeBatch,
  arrayUnion
} from 'firebase/firestore';

// In a Vite environment, we can import JSON directly.
// We must use a try/catch or default value if it doesn't exist, but Vite handles JSON imports.
import firebaseConfigData from '../../firebase-applet-config.json';

const firebaseConfig = firebaseConfigData as any || {};

// Initialize Web SDK
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const databaseId = firebaseConfig.firestoreDatabaseId || "(default)";
export const db = getFirestore(app, databaseId);

const generateId = (collectionName: string) => {
  return doc(collection(db, collectionName)).id;
};

export const firestoreDb = {
  user: {
    findUnique: async (args: { where: { id?: string; email?: string } }) => {
      try {
        const { id, email } = args.where;
        if (id) {
          const docRef = doc(db, 'users', id);
          const docSnap = await getDoc(docRef);
          if (!docSnap.exists()) return null;
          return { id: docSnap.id, ...docSnap.data() } as any;
        }
        if (email) {
          const q = query(collection(db, 'users'), where('email', '==', email), limit(1));
          const snapshot = await getDocs(q);
          if (snapshot.empty) return null;
          const docSnap = snapshot.docs[0];
          return { id: docSnap.id, ...docSnap.data() } as any;
        }
        return null;
      } catch (e) {
        console.error("firestore user.findUnique error", e);
        return null;
      }
    },
    create: async (args: { data: { id?: string; name: string; email: string; password?: string } }) => {
      try {
        const id = args.data.id || generateId('users');
        const userData = {
          name: args.data.name,
          email: args.data.email,
          password: args.data.password || '',
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', id), userData);
        return { id, ...userData };
      } catch (e) {
        console.error("firestore user.create error", e);
        throw e;
      }
    }
  },
  task: {
    count: async (args: { where: { userId: string } }) => {
      try {
        const q = query(collection(db, 'tasks'), where('userId', '==', args.where.userId));
        const snapshot = await getDocs(q);
        return snapshot.size;
      } catch (e) {
        console.error("firestore task.count error", e);
        return 0;
      }
    },
    findMany: async (args: any) => {
      try {
        const q = query(collection(db, 'tasks'), where('userId', '==', args.where.userId));
        const snapshot = await getDocs(q);
        const tasks: any[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          tasks.push({
            id: docSnap.id,
            ...data,
            deadline: data.deadline ? new Date(data.deadline) : null,
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
            aiPlans: data.aiPlans || []
          });
        });

        // Sort in memory to avoid needing composite indexes in Firestore
        tasks.sort((a, b) => {
          const priorityOrder: Record<string, number> = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
          const pA = priorityOrder[a.priority] !== undefined ? priorityOrder[a.priority] : 4;
          const pB = priorityOrder[b.priority] !== undefined ? priorityOrder[b.priority] : 4;
          if (pA !== pB) return pA - pB;

          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        });

        return tasks;
      } catch (e) {
        console.error("firestore task.findMany error", e);
        return [];
      }
    },
    create: async (args: { data: any }) => {
      try {
        const id = generateId('tasks');
        const taskData = {
          ...args.data,
          deadline: args.data.deadline ? new Date(args.data.deadline).toISOString() : null,
          createdAt: new Date().toISOString(),
          aiPlans: []
        };
        await setDoc(doc(db, 'tasks', id), taskData);
        return {
          id,
          ...taskData,
          deadline: taskData.deadline ? new Date(taskData.deadline) : null,
          createdAt: new Date(taskData.createdAt)
        };
      } catch (e) {
        console.error("firestore task.create error", e);
        throw e;
      }
    },
    update: async (args: { where: { id: string; userId?: string }; data: any }) => {
      try {
        const { id } = args.where;
        const docRef = doc(db, 'tasks', id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          throw new Error(`Task ${id} not found`);
        }
        
        const updateData = { ...args.data };
        if (updateData.deadline) {
          updateData.deadline = new Date(updateData.deadline).toISOString();
        }
        
        await updateDoc(docRef, updateData);
        
        const updatedDocSnap = await getDoc(docRef);
        const updatedData = updatedDocSnap.data() || {};
        return {
          id,
          ...updatedData,
          deadline: updatedData.deadline ? new Date(updatedData.deadline) : null,
          createdAt: updatedData.createdAt ? new Date(updatedData.createdAt) : new Date()
        };
      } catch (e) {
        console.error("firestore task.update error", e);
        throw e;
      }
    },
    delete: async (args: { where: { id: string; userId?: string } }) => {
      try {
        const { id } = args.where;
        await deleteDoc(doc(db, 'tasks', id));
        return { id };
      } catch (e) {
        console.error("firestore task.delete error", e);
        throw e;
      }
    },
    deleteMany: async (args: { where: { userId: string } }) => {
      try {
        const q = query(collection(db, 'tasks'), where('userId', '==', args.where.userId));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return { count: 0 };
        const batch = writeBatch(db);
        snapshot.forEach(docSnap => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
        return { count: snapshot.size };
      } catch (e) {
        console.error("firestore task.deleteMany error", e);
        return { count: 0 };
      }
    }
  },
  aIPlan: {
    create: async (args: { data: { taskId: string; step: string; completionStatus?: boolean } }) => {
      try {
        const { taskId, step, completionStatus } = args.data;
        const planId = generateId('ai_plans');
        const planObj = {
          id: planId,
          taskId,
          step,
          completionStatus: completionStatus || false
        };

        const taskRef = doc(db, 'tasks', taskId);
        await updateDoc(taskRef, {
          aiPlans: arrayUnion(planObj)
        });

        return planObj;
      } catch (e) {
        console.error("firestore aIPlan.create error", e);
        throw e;
      }
    },
    deleteMany: async (args: { where: { task: { userId: string } } }) => {
      try {
        const q = query(collection(db, 'tasks'), where('userId', '==', args.where.task.userId));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return { count: 0 };
        const batch = writeBatch(db);
        snapshot.forEach(docSnap => {
          batch.update(docSnap.ref, { aiPlans: [] });
        });
        await batch.commit();
        return { count: snapshot.size };
      } catch (e) {
        console.error("firestore aIPlan.deleteMany error", e);
        return { count: 0 };
      }
    }
  },
  habit: {
    create: async (args: { data: { userId: string; habitName: string; streak: number } }) => {
      try {
        const id = generateId('habits');
        const habitData = {
          ...args.data,
          completedDates: "[]"
        };
        await setDoc(doc(db, 'habits', id), habitData);
        return { id, ...habitData };
      } catch (e) {
        console.error("firestore habit.create error", e);
        throw e;
      }
    },
    deleteMany: async (args: { where: { userId: string } }) => {
      try {
        const q = query(collection(db, 'habits'), where('userId', '==', args.where.userId));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return { count: 0 };
        const batch = writeBatch(db);
        snapshot.forEach(docSnap => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
        return { count: snapshot.size };
      } catch (e) {
        console.error("firestore habit.deleteMany error", e);
        return { count: 0 };
      }
    }
  },
  analytics: {
    create: async (args: { data: { userId: string; date: Date; productivityScore: number; completedTasks: number; missedTasks: number } }) => {
      try {
        const id = generateId('analytics');
        const analyticsData = {
          userId: args.data.userId,
          date: args.data.date.toISOString(),
          productivityScore: args.data.productivityScore,
          completedTasks: args.data.completedTasks,
          missedTasks: args.data.missedTasks
        };
        await setDoc(doc(db, 'analytics', id), analyticsData);
        return { id, ...analyticsData, date: new Date(analyticsData.date) };
      } catch (e) {
        console.error("firestore analytics.create error", e);
        throw e;
      }
    },
    deleteMany: async (args: { where: { userId: string } }) => {
      try {
        const q = query(collection(db, 'analytics'), where('userId', '==', args.where.userId));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return { count: 0 };
        const batch = writeBatch(db);
        snapshot.forEach(docSnap => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
        return { count: snapshot.size };
      } catch (e) {
        console.error("firestore analytics.deleteMany error", e);
        return { count: 0 };
      }
    }
  },
  aiActivity: {
    create: async (args: { data: { userId: string; type: string; message: string; timestamp?: Date } }) => {
      try {
        const id = generateId('ai_activities');
        const activityData = {
          userId: args.data.userId,
          type: args.data.type,
          message: args.data.message,
          timestamp: (args.data.timestamp || new Date()).toISOString()
        };
        await setDoc(doc(db, 'ai_activities', id), activityData);
        return { id, ...activityData, timestamp: new Date(activityData.timestamp) };
      } catch (e) {
        console.error("firestore aiActivity.create error", e);
        throw e;
      }
    },
    findMany: async (args: { where: { userId: string }; take?: number; orderBy?: any }) => {
      try {
        const q = query(collection(db, 'ai_activities'), where('userId', '==', args.where.userId));
        const snapshot = await getDocs(q);
        const activities: any[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          activities.push({
            id: docSnap.id,
            ...data,
            timestamp: data.timestamp ? new Date(data.timestamp) : new Date()
          });
        });
        activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        if (args.take) return activities.slice(0, args.take);
        return activities;
      } catch (e) {
        console.error("firestore aiActivity.findMany error", e);
        return [];
      }
    },
    deleteMany: async (args: { where: { userId: string } }) => {
      try {
        const q = query(collection(db, 'ai_activities'), where('userId', '==', args.where.userId));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return { count: 0 };
        const batch = writeBatch(db);
        snapshot.forEach(docSnap => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
        return { count: snapshot.size };
      } catch (e) {
        console.error("firestore aiActivity.deleteMany error", e);
        return { count: 0 };
      }
    }
  }
};
