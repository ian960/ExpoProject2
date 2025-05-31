import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import styled from 'styled-components/native';
import Icon from 'react-native-vector-icons/Feather';
import Header from '../../components/Header';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { useFinance } from '../../contexts/finance';
import SafeArea from '../../components/SafeArea';
import { formatDateForAPI } from '../../contexts/finance';

const Container = styled.View`
  flex: 1;
  background-color: #F0F4FF;
`;

const Content = styled.View`
  flex: 1;
  padding: 20px;
`;

const Input = styled.TextInput`
  background-color: #FFFFFF;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 10px;
  height: 50px;
`;

const SelectRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 10px;
  height: 50px;
`;

const SelectButton = styled.TouchableOpacity`
  background-color: ${props => (props.selected ? '#FFFFFF' : '#F0F4FF')};
  padding: 10px;
  border-radius: 5px;
  align-items: center;
  flex-direction: row;
  justify-content: center;
  flex: 1;
  margin-right: ${props => props.marginRight || '0px'};
`;

const SelectText = styled.Text`
  color: #171717;
  margin-left: 5px;
`;

const SaveButton = styled.TouchableOpacity`
  background-color: #00B94A;
  padding: 15px;
  border-radius: 5px;
  align-items: center;
  margin-top: 10px;
  opacity: ${props => (props.disabled ? 0.6 : 1)};
`;

const SaveText = styled.Text`
  color: #FFFFFF;
  font-weight: bold;
`;

export default function Registrar() {
  const navigation = useNavigation();
  const { addMovement, fetchFinanceData } = useFinance();
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('receita');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!value || isNaN(parseFloat(value))) {
      Alert.alert('Erro', 'Preencha o valor corretamente.');
      return;
    }

    if (!description) {
      Alert.alert('Erro', 'Preencha a descrição.');
      return;
    }

    setLoading(true);

    try {
      const movementData = {
        description,
        value: parseFloat(value),
        type,
        date: formatDateForAPI(new Date()),
      };

      console.log('Enviando dados para /receive:', movementData);

      const response = await api.post('/receive', movementData);

      console.log('Resposta do /receive:', response.data);

      addMovement({
        ...response.data,
        ...movementData,
      });

      console.log('Chamando fetchFinanceData...');
      await fetchFinanceData();
      console.log('fetchFinanceData concluído.');

      Alert.alert('Sucesso', 'Movimentação registrada com sucesso!');

      setValue('');
      setDescription('');
      setType('receita');

      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error) {
      console.error('Erro ao registrar movimentação:', {
        message: error.message,
        response: error.response ? error.response.data : null,
        status: error.response ? error.response.status : null,
      });
      Alert.alert(
        'Erro',
        error.response?.data?.message || 'Falha ao registrar movimentação. Verifique sua conexão ou tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeArea>
      <Container>
        <Header title="Registrar Movimentação" />
        <Content>
          <Input
            placeholder="Valor"
            keyboardType="numeric"
            value={value}
            onChangeText={setValue}
            editable={!loading}
          />
          <Input
            placeholder="Descrição"
            value={description}
            onChangeText={setDescription}
            editable={!loading}
          />
          <SelectRow>
            <SelectButton
              selected={type === 'receita'}
              type="receita"
              marginRight="5px"
              onPress={() => setType('receita')}
              disabled={loading}
            >
              <Icon name="arrow-up" size={16} color="#171717" />
              <SelectText>Receita</SelectText>
            </SelectButton>
            <SelectButton
              selected={type === 'despesa'}
              type="despesa"
              onPress={() => setType('despesa')}
              disabled={loading}
            >
              <Icon name="arrow-down" size={16} color="#171717" />
              <SelectText>Despesa</SelectText>
            </SelectButton>
          </SelectRow>
          <SaveButton onPress={handleSave} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <SaveText>Registrar</SaveText>
            )}
          </SaveButton>
        </Content>
      </Container>
    </SafeArea>
  );
}