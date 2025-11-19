# 🔧 Fix MongoDB Connection Issue in Coolify

## Problem
```
MongooseServerSelectionError: getaddrinfo EAI_AGAIN vmp-mongo
```

The application cannot resolve the MongoDB hostname `vmp-mongo`.

---

## ✅ Solution: Create MongoDB Service in Coolify

### Step 1: Check if MongoDB Service Exists

1. **Go to Coolify Dashboard**
2. **Check "Resources" or "Services" section**
3. **Look for any MongoDB service**

**If MongoDB service exists:**
- Note the **exact service name** (might be different from `vmp-mongo`)
- Use that name in `MONGO_URI`

**If MongoDB service does NOT exist:**
- Continue to Step 2

---

### Step 2: Create MongoDB Service in Coolify

1. **Click "+ New Resource" or "+ Add Resource"**
2. **Select "Database" → "MongoDB"**
3. **Configure with your specific password:**
   ```
   Name: vmp-mongo
   Version: 7.0 (or latest stable)
   Port: 27017 (internal)
   Root Username: admin
   Root Password: 0814940664asdUZ@
   Database Name: vmp_production
   ```
   ⚠️ **Important:** Use the exact password `0814940664asdUZ@` (including the `@` symbol)
4. **Click "Deploy"**
5. **Wait for status: ✅ Running**

---

### Step 3: Get MongoDB Connection String

After MongoDB is deployed:

1. **Click on the MongoDB service**
2. **Find "Connection String" or "Internal URL"**
3. **Copy the connection string**

**Format should be:**
```
mongodb://admin:PASSWORD@vmp-mongo:27017/vmp_production
```

**OR if Coolify uses a different hostname:**
```
mongodb://admin:PASSWORD@[COOLIFY_SERVICE_NAME]:27017/vmp_production
```

---

### Step 4: Update Environment Variables in Coolify

1. **Go to your API application in Coolify**
2. **Click "Environment Variables"**
3. **Update `MONGO_URI` with your specific password:**

   ```env
   MONGO_URI=mongodb://admin:0814940664asdUZ@@vmp-mongo:27017/vmp_production
   ```
   
   ⚠️ **Note:** The double `@@` is intentional - our code automatically fixes it to single `@` during connection.
   
   **If MongoDB service has a different name (not `vmp-mongo`):**
   ```env
   MONGO_URI=mongodb://admin:0814940664asdUZ@@[ACTUAL_SERVICE_NAME]:27017/vmp_production
   ```

4. **Save environment variables**

---

### Step 5: Redeploy Application

1. **Click "Deploy" or "Redeploy"**
2. **Wait for build to complete**
3. **Check logs** - should see:
   ```
   Connecting to MongoDB: mongodb://admin:****@vmp-mongo:27017/vmp_production
   ✅ API running on http://0.0.0.0:3000
   ```

---

## 🔍 Alternative: Use External MongoDB

If you prefer to use an external MongoDB (MongoDB Atlas, etc.):

1. **Get connection string from your MongoDB provider**
2. **Update `MONGO_URI` in Coolify:**
   ```env
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/vmp_production
   ```
3. **Redeploy**

---

## 🧪 Verify MongoDB Connection

After redeploy, check logs:

```bash
# In Coolify logs, you should see:
✅ Connecting to MongoDB: mongodb://admin:****@vmp-mongo:27017/vmp_production
✅ API running on http://0.0.0.0:3000
```

**If still failing:**
1. Check MongoDB service is **Running** in Coolify
2. Verify password matches exactly
3. Check service name matches `MONGO_URI` hostname
4. Ensure MongoDB and API are in the **same Coolify project**

---

## 📝 Quick Checklist

- [ ] MongoDB service created in Coolify
- [ ] MongoDB status: ✅ Running
- [ ] `MONGO_URI` updated with correct hostname
- [ ] `MONGO_URI` password matches MongoDB password
- [ ] Application redeployed
- [ ] Logs show successful MongoDB connection

---

## 🆘 Still Having Issues?

1. **Check MongoDB service logs** in Coolify
2. **Verify network connectivity:**
   - Both services should be in same project
   - MongoDB should be accessible internally
3. **Test connection manually:**
   - Use Coolify's terminal/exec feature
   - Try: `mongosh mongodb://admin:PASSWORD@vmp-mongo:27017/vmp_production`

