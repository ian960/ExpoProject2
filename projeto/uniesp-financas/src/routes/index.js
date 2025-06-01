import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from "../contexts/auth";
import AuthRoutes from './auth.routes';
import AppRoutes from "./app.routes";
import { ActivityIndicator, View } from "react-native";
import { useNavigation } from '@react-navigation/native';

function Routes() {
  const { signed, loading } = useContext(AuthContext);
  const navigation = useNavigation();
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    console.log('Routes - Signed:', signed, 'Loading:', loading, 'HasNavigated:', hasNavigated);
    if (signed && !loading && !hasNavigated) {
      console.log('Executando navigation.reset para Home');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
      setHasNavigated(true);
    } else if (!signed && hasNavigated) {
      console.log('Signed mudou para false, resetando hasNavigated');
      setHasNavigated(false);
    }
  }, [signed, loading, hasNavigated, navigation]);

  if (loading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0F4FF',
      }}>
        <ActivityIndicator size="large" color='#131313' />
      </View>
    );
  }

  console.log('Renderizando:', signed ? 'AppRoutes' : 'AuthRoutes');
  return signed ? <AppRoutes /> : <AuthRoutes />;
}

export default Routes;