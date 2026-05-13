import 'dart:convert';
import 'dart:io';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:khmer_lesson/models/user/user.dart';
import 'package:khmer_lesson/services/network/api_service.dart';
import 'package:khmer_lesson/shared/users/user_auth.dart';

class LoginEntry{
  final String email;
  final String password;

  const LoginEntry({required this.email, required this.password});

  Map<String, dynamic> toJson() {
    return {
      "email": email,
      "password": password
    };
  }
}

class RegistrationEntry extends LoginEntry{
  final String firstName;
  final String lastName;
  const RegistrationEntry({
    required this.firstName,
    required this.lastName,
    required super.email,
    required super.password});

  @override
  Map<String, dynamic> toJson() {
    // TODO: implement toJson
    return {
      "email": email,
      "password": password,
      "firstName": firstName,
      "lastName": lastName
    };
  }
}

abstract class BaseAuthentication with BaseHttpUrl, BaseHttpHeader{
  Future<bool> login({required LoginEntry entry});
  Future<bool> register({required RegistrationEntry entry});
  Future<bool> registerWithAuthService({
    required String? firstName,
    required String? lastName,
    required String email,
    required String registrationType});
  Future<String> forgotPassword({required String email});
  Future<bool> changePassword({required String currentPassword,
    required String newPassword, required String confirmPassword});
  Future<User?> verifyAppleToken({required String idToken});
  Future<void> logout();
}

class Authentication extends BaseAuthentication {
  // Authentication._internal();
  // static final Authentication _instance = Authentication._internal();
  // factory Authentication() => _instance;

  // @override
  // Future<bool> login({required LoginEntry entry}) async{
  //   try{
  //     final response = await http.post(Uri.parse("$baseUrlAuth/login"),
  //         headers: headerWithApplicationFormUrlEncoded,
  //         body: entry.toJson(), encoding: Encoding.getByName("utf-8"));
  //     final map = json.decode(response.body);
  //     if(response.statusCode != 200){
  //       if(response.statusCode == 500){
  //         throw map["error"] ?? "${response.reasonPhrase}";
  //       }
  //       throw map["message"] ?? "${response.reasonPhrase}";
  //     }
  //     final token = map["token"];
  //     final refreshToken = map["refreshToken"];
  //     final user = map["user"];
  //     if(user != null){
  //       await UserAuth().saveSession(User.fromJson(user), token, refreshToken);
  //     }
  //     return token != null && token.toString().isNotEmpty;
  //   } on http.ClientException catch(_){
  //     throw "Failed to login!";
  //   } on SocketException catch(_){
  //     throw "Failed to login!";
  //   } catch(e){
  //     rethrow;
  //   }
  // }
  @override
Future<bool> login({required LoginEntry entry}) async {
  try {
    final response = await http.post(
      Uri.parse("$baseUrlAuth/login"),
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: jsonEncode(entry.toJson()),
    );

    final map = json.decode(response.body);

    if (response.statusCode != 200) {
      if (response.statusCode == 500) {
        throw map["error"] ?? response.reasonPhrase ?? "Server error";
      }

      throw map["message"] ?? response.reasonPhrase ?? "Login failed";
    }

    final token = map["token"];
    final refreshToken = map["refreshToken"];
    final user = map["user"];

    if (user != null) {
      await UserAuth().saveSession(
        User.fromJson(user),
        token,
        refreshToken,
      );
    }

    return token != null && token.toString().isNotEmpty;

  } on http.ClientException {
    throw "Failed to login!";
  } on SocketException {
    throw "No internet connection!";
  } catch (e) {
    rethrow;
  }
}

  @override
  Future<bool> register({required RegistrationEntry entry}) async{
    try{
      final response = await http.post(Uri.parse("$baseUrlAuth/register"),
          headers: headerWithApplicationFormUrlEncoded,
          body: entry.toJson(), encoding: Encoding.getByName("utf-8"));
      final map = json.decode(response.body);
      if(response.statusCode != 201){
        if(response.statusCode == 500){
          throw map["error"] ?? "${response.reasonPhrase}";
        }else if(response.statusCode == 400){
          final errors = map["errors"];
          if(errors != null && errors is List){
            if(errors.isNotEmpty){
              final message = errors.first["message"];
              throw {
                "status_code": response.statusCode,
                "message": message
              };
            }
          }
        }
        throw map["message"] ?? "${response.reasonPhrase}";
      }
      final token = map["token"];
      final refreshToken = map["refreshToken"];
      final user = map["user"];
      if(user != null){
        await UserAuth().saveSession(User.fromJson(user), token, refreshToken);
      }
      return token != null && token.toString().isNotEmpty;
    } on http.ClientException catch(_){
      throw "Failed to registration!";
    } on SocketException catch(_){
      throw "Failed to registration!";
    } catch(e){
      rethrow;
    }
  }

  @override
  Future<bool> registerWithAuthService({
    required String? firstName,
    required String? lastName,
    required String email,
    required String registrationType}) async{
    try{
      final body = {
        "email": email,
        "firstName": firstName,
        "lastName": lastName,
        "registrationType": registrationType
      };
      final response = await http.post(Uri.parse("$baseUrlAuth/register-auth-service"),
          headers: headerWithApplicationFormUrlEncoded,
          body: body, encoding: Encoding.getByName("utf-8"));
      final map = json.decode(response.body);
      if(response.statusCode != 201 && response.statusCode != 200){
        if(response.statusCode == 500){
          throw map["error"] ?? "${response.reasonPhrase}";
        }else if(response.statusCode == 400){
          final errors = map["errors"];
          if(errors != null && errors is List){
            if(errors.isNotEmpty){
              final message = errors.first["message"];
              throw {
                "status_code": response.statusCode,
                "message": message
              };
            }
          }
        }
        throw map["message"] ?? "${response.reasonPhrase}";
      }
      final user = map["user"];
      final token = map["token"];
      final refreshToken = map["refreshToken"];
      if(user != null){
        await UserAuth().saveSession(User.fromJson(user), token, refreshToken);
      }
      return token != null && token.toString().isNotEmpty;
    } on http.ClientException catch(_){
      throw "Failed to registration!";
    } on SocketException catch(_){
      throw "Failed to registration!";
    } catch(e){
      rethrow;
    }
  }

  @override
  Future<String> forgotPassword({required String email}) async{
    try{
      final response = await http.post(Uri.parse("$baseUrlAuth/forgot-password"),
          headers: headerWithApplicationFormUrlEncoded,
          body: {
            "email": email
          },
          encoding: Encoding.getByName('utf-8')
      );
      final map = json.decode(response.body);
      if(response.statusCode != 200){
        throw map["message"] ?? "${response.reasonPhrase}";
      }
      return map["message"] ?? "";
    } on SocketException catch(_){
      throw "Failed to forgot password";
    } on http.ClientException catch(_){
      throw "Failed to forgot password";
    } catch(_){
      rethrow;
    }
  }

  @override
  Future<void> logout() async{
    try{
      final response = await http.post(Uri.parse("$baseUrlAuth/logout"),
          headers: headerWithAuthorization);
      if(response.statusCode != 200){
        final map = json.decode(response.body);
        throw map["message"] ?? "${response.reasonPhrase}";
      }
      const storage = FlutterSecureStorage();
      const key = String.fromEnvironment("SESSION");
      await storage.delete(key: key);
    } on SocketException catch(_){
      throw "Failed to logout";
    } on http.ClientException catch(_){
      throw "Failed to logout";
    } catch(_){
      rethrow;
    }
  }

  @override
  Future<User?> verifyAppleToken({required String idToken}) async{
    // TODO: implement verifyAppleToken
    try{
      final body = {
        "idToken": idToken
      };
      final response = await http.post(Uri.parse("$baseUrlAuth/verify-apple-id-token"),
          headers: headerWithApplicationFormUrlEncoded,
          body: body, encoding: Encoding.getByName("utf-8"));
      if(response.statusCode != 200){
        final map = json.decode(response.body);
        throw map["message"] ?? "${response.reasonPhrase}";
      }
      final map = json.decode(response.body);
      final user = map["user"];
      return User(email: user["email"]);
    } on SocketException catch(_){
      throw "Failed to verify apple token";
    } on http.ClientException catch(_){
      throw "Failed to verify apple token";
    } catch(_){
      rethrow;
    }
  }

  @override
  Future<bool> changePassword({required String currentPassword,
    required String newPassword, required String confirmPassword}) async{
    // TODO: implement changePassword
    try{
      final response = await http.put(Uri.parse("$baseUrlAuth/change-password"),
          headers: headerWithApplicationFormUrlEncodedAndAuthorization,
          body: {
            "id": "${UserAuth().currentUser?.id}",
            "currentPassword": currentPassword,
            "newPassword": newPassword,
            "confirmPassword": confirmPassword
          },
          encoding: Encoding.getByName('utf-8')
      );
      if(response.statusCode != 200){
        final map = json.decode(response.body);
        throw map["message"] ?? "${response.reasonPhrase}";
      }
      return response.statusCode == 200;
    } on SocketException catch(_){
      throw "Failed to change password.";
    } on http.ClientException catch(_){
      throw "Failed to change password.";
    } catch(_){
      rethrow;
    }
  }
}