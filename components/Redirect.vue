<script lang="ts">
import { useRouter } from 'vitepress';
import { resolve } from '@/utils/path';

export default {
  props: {
    href: {
      type: String,
      required: true,
    },
    relative: {
      type: Boolean,
      defalut: false,
    },
  },
  setup(props) {
    const router = useRouter();
    const { href, relative } = props;
    router.go(relative ? resolve(href) : href);
    return () => null;
  },
};
</script>
