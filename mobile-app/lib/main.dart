import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:geolocator/geolocator.dart';

void main() {
  runApp(MyApp());
}

const String API = 'http://localhost:4000/api';

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Smart E-Waste Mobile',
      theme: ThemeData(
        primarySwatch: Colors.green,
        useMaterial3: true,
        appBarTheme: AppBarTheme(
          backgroundColor: Colors.green[600],
          foregroundColor: Colors.white,
        ),
      ),
      home: HomePage(),
    );
  }
}

class HomePage extends StatefulWidget {
  @override
  _HomePageState createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  String token = '';
  List<dynamic> centers = [];
  List<dynamic> myPickups = [];
  bool isLoading = false;
  bool isLoggedIn = false;
  late TextEditingController nameCtrl;
  late TextEditingController emailCtrl;
  late TextEditingController passwordCtrl;
  late TextEditingController itemsCtrl;
  late TextEditingController weightCtrl;
  final _storage = const FlutterSecureStorage();
  List<dynamic> nearestCenters = [];
  bool isFindingNearest = false;
  String? selectedCenterId;
  Map<String, dynamic>? selectedCenter;

  @override
  void initState() {
    super.initState();
    nameCtrl = TextEditingController(text: 'New User');
    emailCtrl = TextEditingController(text: 'user@example.com');
    passwordCtrl = TextEditingController(text: 'user123');
    itemsCtrl = TextEditingController();
    weightCtrl = TextEditingController();
    _loadToken();
  }

  @override
  void dispose() {
    nameCtrl.dispose();
    emailCtrl.dispose();
    passwordCtrl.dispose();
    itemsCtrl.dispose();
    weightCtrl.dispose();
    super.dispose();
  }

  bool isRegistering = false;

  Future<void> register() async {
    if (!_validateRegistrationInputs()) return;

    setState(() => isLoading = true);
    try {
      final res = await http
          .post(
            Uri.parse('$API/auth/register'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'name': nameCtrl.text,
              'email': emailCtrl.text,
              'password': passwordCtrl.text,
            }),
          )
          .timeout(Duration(seconds: 10));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        setState(() {
          token = data['token'];
          isLoggedIn = true;
        });
        // persist token
        try {
          await _storage.write(key: 'token', value: token);
        } catch (e) {
          print('storage write error $e');
        }
        _showSuccess('Registration successful! Logged in.');
        await fetchCenters();
        await fetchMyPickups();
      } else {
        _showError('Registration failed: ${res.body}');
      }
    } catch (e) {
      _showError('Connection error: $e');
    } finally {
      setState(() => isLoading = false);
    }
  }

  Future<void> login() async {
    if (!_validateLoginInputs()) return;

    setState(() => isLoading = true);
    try {
      final res = await http
          .post(
            Uri.parse('$API/auth/login'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'email': emailCtrl.text,
              'password': passwordCtrl.text,
            }),
          )
          .timeout(Duration(seconds: 10));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        setState(() {
          token = data['token'];
          isLoggedIn = true;
        });
        // persist token
        try {
          await _storage.write(key: 'token', value: token);
        } catch (e) {
          print('storage write error $e');
        }
        _showSuccess('Login successful!');
        await fetchCenters();
        await fetchMyPickups();
      } else {
        _showError('Login failed: ${res.body}');
      }
    } catch (e) {
      _showError('Connection error: $e');
    } finally {
      setState(() => isLoading = false);
    }
  }

  Future<void> fetchCenters() async {
    if (token.isEmpty) return;
    try {
      final res = await http.get(
        Uri.parse('$API/centers'),
        headers: {'Authorization': 'Bearer $token'},
      ).timeout(Duration(seconds: 10));

      if (res.statusCode == 200) {
        setState(() => centers = jsonDecode(res.body));
      }
    } catch (e) {
      print('Fetch centers error: $e');
    }
  }

  Future<void> fetchMyPickups() async {
    if (token.isEmpty) return;
    try {
      final res = await http.get(
        Uri.parse('$API/pickups'),
        headers: {'Authorization': 'Bearer $token'},
      ).timeout(Duration(seconds: 10));

      if (res.statusCode == 200) {
        setState(() => myPickups = jsonDecode(res.body));
      }
    } catch (e) {
      print('Fetch pickups error: $e');
    }
  }

  Future<void> requestPickup() async {
    if (token.isEmpty) {
      _showError('Please login first');
      return;
    }

    if (itemsCtrl.text.isEmpty || weightCtrl.text.isEmpty) {
      _showError('Please fill all fields');
      return;
    }

    setState(() => isLoading = true);
    try {
      final items = itemsCtrl.text
          .split(',')
          .map((s) => s.trim())
          .where((s) => s.isNotEmpty)
          .toList();
      final weight = int.tryParse(weightCtrl.text) ?? 0;

      final Map<String, dynamic> body = {
        'items': items,
        'weightGrams': weight,
        'location': 'Home Address',
      };
      if (selectedCenterId != null && selectedCenterId!.isNotEmpty) {
        body['center'] = selectedCenterId;
      }

      final res = await http
          .post(
            Uri.parse('$API/pickups'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $token',
            },
            body: jsonEncode(body),
          )
          .timeout(Duration(seconds: 10));

      if (res.statusCode == 201 || res.statusCode == 200) {
        _showSuccess('Pickup request submitted!');
        itemsCtrl.clear();
        weightCtrl.clear();
        // clear selected center after successful request
        setState(() {
          selectedCenterId = null;
          selectedCenter = null;
        });
        await fetchMyPickups();
      } else {
        _showError('Request failed: ${res.body}');
      }
    } catch (e) {
      _showError('Connection error: $e');
    } finally {
      setState(() => isLoading = false);
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: Colors.red,
        duration: Duration(seconds: 3),
      ),
    );
  }

  void _showSuccess(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: Colors.green,
        duration: Duration(seconds: 2),
      ),
    );
  }

  void logout() {
    setState(() {
      token = '';
      isLoggedIn = false;
      centers.clear();
      myPickups.clear();
    });
    _showSuccess('Logged out');
    // remove persisted token
    try {
      _storage.delete(key: 'token');
    } catch (e) {
      print('storage delete error $e');
    }
  }

  Future<void> _loadToken() async {
    try {
      final t = await _storage.read(key: 'token');
      if (t != null && t.isNotEmpty) {
        setState(() {
          token = t;
          isLoggedIn = true;
        });
        await fetchCenters();
        await fetchMyPickups();
      }
    } catch (e) {
      print('Error loading token: $e');
    }
  }

  Future<void> findNearestCenters() async {
    if (token.isEmpty) {
      _showError('Please login to find nearest centers');
      return;
    }
    setState(() {
      isFindingNearest = true;
    });
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        _showError('Location permission is required');
        return;
      }

      final pos = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high);
      final lat = pos.latitude;
      final lon = pos.longitude;

      final uri = Uri.parse(
          '$API/centers/nearest/distance?latitude=$lat&longitude=$lon&limit=8');
      final res = await http.get(uri, headers: {
        'Authorization': 'Bearer $token'
      }).timeout(Duration(seconds: 10));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        List list;
        if (data is List)
          list = data;
        else if (data is Map && data.containsKey('value'))
          list = data['value'];
        else if (data is Map &&
            data.containsKey('Count') &&
            data.containsKey('value'))
          list = data['value'];
        else if (data is Map)
          list = [data];
        else
          list = [];
        setState(() {
          nearestCenters = list;
          showNearestFromMobile = true;
        });
        _showSuccess('Found ${nearestCenters.length} nearby centers');
      } else {
        _showError('Nearest centers request failed: ${res.statusCode}');
      }
    } catch (e) {
      _showError('Error finding location: $e');
    } finally {
      setState(() {
        isFindingNearest = false;
      });
    }
  }

  bool showNearestFromMobile = false;

  bool _validateEmail(String email) {
    final re = RegExp(r"^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}");
    return re.hasMatch(email);
  }

  bool _validateLoginInputs() {
    if (emailCtrl.text.isEmpty || passwordCtrl.text.isEmpty) {
      _showError('Email and password required');
      return false;
    }
    if (!_validateEmail(emailCtrl.text)) {
      _showError('Enter a valid email');
      return false;
    }
    if (passwordCtrl.text.length < 6) {
      _showError('Password must be at least 6 characters');
      return false;
    }
    return true;
  }

  bool _validateRegistrationInputs() {
    if (nameCtrl.text.isEmpty) {
      _showError('Full name required');
      return false;
    }
    if (!_validateEmail(emailCtrl.text)) {
      _showError('Enter a valid email');
      return false;
    }
    if (passwordCtrl.text.length < 6) {
      _showError('Password must be at least 6 characters');
      return false;
    }
    return true;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Smart E-Waste Mobile'),
        actions: [
          if (isLoggedIn)
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Center(
                child: GestureDetector(
                  onTap: logout,
                  child: const Text(
                    'Logout',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            )
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: isLoggedIn ? _buildMainContent() : _buildLoginForm(),
            ),
    );
  }

  Widget _buildLoginForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 20),
        Text(
          isRegistering ? 'Create an Account' : 'Login to Smart E-Waste',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 20),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                if (isRegistering) ...[
                  TextField(
                    controller: nameCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Full Name',
                      hintText: 'John Doe',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
                TextField(
                  controller: emailCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Email',
                    hintText: 'user@example.com',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: passwordCtrl,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Password',
                    hintText: 'user123',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed:
                      isLoading ? null : (isRegistering ? register : login),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: Text(isRegistering ? 'Register' : 'Login'),
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: () =>
                      setState(() => isRegistering = !isRegistering),
                  child: Text(isRegistering
                      ? 'Have an account? Login'
                      : 'Create a new account'),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMainContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Request E-Waste Pickup',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                TextField(
                  controller: itemsCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Items (comma separated)',
                    hintText: 'e.g., Keyboard, Mouse, Monitor',
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 2,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: weightCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Weight (grams)',
                    hintText: '1500',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: isLoading ? null : requestPickup,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: const Text('Submit Pickup Request'),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        Text(
          'Available Centers',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            ElevatedButton(
              onPressed: isFindingNearest ? null : findNearestCenters,
              child: Text(
                  isFindingNearest ? 'Finding...' : 'Find Nearest Centers'),
            ),
            const SizedBox(width: 12),
            if (showNearestFromMobile && nearestCenters.isNotEmpty)
              TextButton(
                  onPressed: () {
                    setState(() => showNearestFromMobile = false);
                  },
                  child: Text('Show All'))
          ],
        ),
        const SizedBox(height: 12),
        if (showNearestFromMobile && nearestCenters.isNotEmpty) ...[
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Nearest Centers',
                      style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 8),
                  ...nearestCenters.map((c) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 6.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(c['name'] ?? 'Unknown',
                                          style: TextStyle(
                                              fontWeight: FontWeight.bold)),
                                      Text(c['address'] ?? ''),
                                      if (c['distanceKm'] != null)
                                        Text('Distance: ${c['distanceKm']} km'),
                                    ],
                                  ),
                                ),
                                ElevatedButton(
                                  onPressed: () {
                                    setState(() {
                                      selectedCenterId = c['_id'];
                                      selectedCenter =
                                          Map<String, dynamic>.from(c);
                                    });
                                    _showSuccess(
                                        'Selected center: ${c['name']}');
                                  },
                                  child: Text(selectedCenterId == c['_id']
                                      ? 'Selected'
                                      : 'Select'),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                          ],
                        ),
                      ))
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
        ],
        const SizedBox(height: 12),
        if (centers.isEmpty)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Text('No centers available'),
            ),
          )
        else
          ...centers.map((center) => Card(
                margin: const EdgeInsets.symmetric(vertical: 8),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        center['name'] ?? 'Unknown',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 4),
                      Text(center['address'] ?? ''),
                      const SizedBox(height: 4),
                      Text(
                        'Phone: ${center['phone'] ?? 'N/A'}',
                        style:
                            const TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                    ],
                  ),
                ),
              )),
        const SizedBox(height: 24),
        Text(
          'My Pickup Requests',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 12),
        if (myPickups.isEmpty)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Text('No pickup requests yet'),
            ),
          )
        else
          ...myPickups.map((pickup) => Card(
                margin: const EdgeInsets.symmetric(vertical: 8),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Status: ${pickup['status'] ?? 'pending'}',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 4),
                      Text('Items: ${(pickup['items'] ?? []).join(', ')}'),
                      const SizedBox(height: 4),
                      Text('Weight: ${pickup['weightGrams'] ?? 0}g'),
                    ],
                  ),
                ),
              )),
      ],
    );
  }
}
