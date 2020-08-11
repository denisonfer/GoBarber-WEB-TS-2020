import React, { useCallback, useRef, ChangeEvent } from 'react';
import { FiMail, FiLock, FiUser, FiCamera, FiArrowLeft } from 'react-icons/fi';
import { Form } from '@unform/web';
import { FormHandles } from '@unform/core';
import * as Yup from 'yup';
import { useHistory, Link } from 'react-router-dom';

import getValidationErrors from '../../utils/getValidationErrors';
import Input from '../../components/Input';
import Button from '../../components/Button';

import { useToast } from '../../hooks/Toast';
import api from '../../services/api';
import { useAuth } from '../../hooks/Auth';

import { Container, Content, AvatarInput } from './styles';

interface ProfileFormData {
  nome: string;
  email: string;
  senha_antiga: string;
  senha: string;
  confirmacao_senha: string;
}

const Profile: React.FC = () => {
  const formRef = useRef<FormHandles>(null);

  const { usuario, updateUser } = useAuth();

  const { addToast } = useToast();
  const history = useHistory();

  const handleSubmit = useCallback(
    async (data: ProfileFormData): Promise<void> => {
      try {
        formRef.current?.setErrors({});

        const schema = Yup.object().shape({
          nome: Yup.string().required('Campo é obrigatório'),
          email: Yup.string()
            .email('digite um e-mail válido')
            .required('Campo é obrigatório'),
          senha_antiga: Yup.string(),
          senha: Yup.string().when('senha_antiga', {
            is: val => !!val.length,
            then: Yup.string().required('Campo é obrigatório'),
            otherwise: Yup.string(),
          }),
          confirmacao_senha: Yup.string()
            .when('senha_antiga', {
              is: val => !!val.length,
              then: Yup.string().required('Campo é obrigatório'),
              otherwise: Yup.string(),
            })
            .oneOf(
              [Yup.ref('senha'), undefined],
              'Confirmação precisa ser igual ao campo senha',
            ),
        });

        await schema.validate(data, {
          abortEarly: false,
        });

        const { nome, email, senha_antiga, senha, confirmacao_senha } = data;

        const formData = {
          nome,
          email,
          ...(senha_antiga
            ? {
              senha_antiga,
              senha,
              confirmacao_senha,
            }
            : {}),
        };

        const response = await api.put('/perfil', formData);

        history.push('/dashboard');

        updateUser(response.data);

        addToast({
          type: 'success',
          title: 'Perfil atualizado!',
        });
      } catch (error) {
        if (error instanceof Yup.ValidationError) {
          const errors = getValidationErrors(error);

          formRef.current?.setErrors(errors);

          return;
        }

        addToast({
          type: 'error',
          title: 'erro na atualizção de perfil',
        });
      }
    },
    [addToast, history],
  );

  const handleAvatarChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const data = new FormData();

        data.append('avatar', e.target.files[0]);

        api.patch('/usuarios/avatar', data).then(response => {
          updateUser(response.data);
          addToast({
            type: 'success',
            title: 'Avatar atualizado!',
          });
        });
      }
    },
    [addToast, updateUser],
  );

  return (
    <Container>
      <header>
        <div>
          <Link to="/">
            <FiArrowLeft />
          </Link>
        </div>
      </header>

      <Content>
        <Form
          ref={formRef}
          initialData={{
            nome: usuario.nome,
            email: usuario.email,
          }}
          onSubmit={handleSubmit}
        >
          <AvatarInput>
            <img src={usuario.avatar_url} alt={usuario.nome} />
            <label htmlFor="avatar">
              <FiCamera />
              <input type="file" id="avatar" onChange={handleAvatarChange} />
            </label>
          </AvatarInput>

          <h1>Meu Perfil</h1>

          <Input name="nome" icon={FiUser} placeholder="Nome" />
          <Input name="email" icon={FiMail} placeholder="E-mail" />

          <Input
            containerStyle={{ marginTop: 24 }}
            name="senha_antiga"
            icon={FiLock}
            type="password"
            placeholder="Senha atual"
          />
          <Input
            name="senha"
            icon={FiLock}
            type="password"
            placeholder="Senha nova"
          />
          <Input
            name="confirmacao_senha"
            icon={FiLock}
            type="password"
            placeholder="Confirmar senha"
          />

          <Button type="submit">Confirmar mudanças</Button>
        </Form>
      </Content>
    </Container>
  );
};

export default Profile;
