import { getTitleRowClass, getTitleTextClass } from './commentSectionClassNames';

export default function PostCommentsHeader({ isFacebookEmbed, embedded }) {
    return (
        <div className={getTitleRowClass(isFacebookEmbed, embedded)}>
            <h2 className={getTitleTextClass(isFacebookEmbed, embedded)}>Comments</h2>
        </div>
    );
}
