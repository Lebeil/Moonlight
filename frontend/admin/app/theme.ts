import { createTheme } from '@rneui/themed';

export const theme = createTheme({
    lightColors: {
        primary: '#007bff', // Bleu Bootstrap
        secondary: '#6c757d', // Gris secondaire
        background: '#f8f9fa', // Blanc cassé
        grey3: '#d3d3d3', // Définir vos valeurs de couleur
    },
    darkColors: {
        primary: '#007bff',
        secondary: '#6c757d',
        background: '#212529', // Gris foncé
        grey3: '#d3d3d3', // Définir vos valeurs de couleur
    },
    components: {
        Button: () => ({
            buttonStyle: {
                borderRadius: 5,
            },
        }),
        Input: () => ({
            inputContainerStyle: {
                borderRadius: 5,
                borderWidth: 1,
                borderColor: '#d3d3d3', // Utiliser une valeur par défaut
                paddingHorizontal: 10,
            },
        }),
    },
});

export default theme;